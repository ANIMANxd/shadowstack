"""
CUDA Compatibility Check
Verifies installed CUDA is compatible with the local GPU for model training.
"""

import subprocess
import sys


def check_nvidia_smi():
    print("=" * 50)
    print("  1. NVIDIA Driver & GPU Detection")
    print("=" * 50)
    try:
        result = subprocess.run(
            ["nvidia-smi", "--query-gpu=name,driver_version,memory.total,compute_cap",
             "--format=csv,noheader"],
            capture_output=True, text=True
        )
        if result.returncode != 0:
            print("❌ nvidia-smi failed. Is an NVIDIA GPU installed and driver loaded?")
            print(result.stderr.strip())
            return None
        lines = result.stdout.strip().split("\n")
        gpus = []
        for i, line in enumerate(lines):
            parts = [p.strip() for p in line.split(",")]
            name, driver, memory, compute_cap = parts
            print(f"  GPU {i}: {name}")
            print(f"    Driver Version : {driver}")
            print(f"    VRAM           : {memory}")
            print(f"    Compute Cap.   : {compute_cap}")
            gpus.append({"name": name, "driver": driver, "memory": memory, "compute_cap": compute_cap})
        return gpus
    except FileNotFoundError:
        print("❌ nvidia-smi not found. No NVIDIA GPU/driver detected.")
        return None


def check_cuda_toolkit():
    print("\n" + "=" * 50)
    print("  2. CUDA Toolkit (nvcc)")
    print("=" * 50)
    try:
        result = subprocess.run(["nvcc", "--version"], capture_output=True, text=True)
        if result.returncode == 0:
            for line in result.stdout.strip().split("\n"):
                print(f"  {line}")
            # Parse version from output like "release 12.1, V12.1.105"
            import re
            match = re.search(r"release (\d+\.\d+)", result.stdout)
            if match:
                return match.group(1)
        else:
            print("⚠️  nvcc not found in PATH. CUDA toolkit may not be installed or not on PATH.")
    except FileNotFoundError:
        print("⚠️  nvcc not found. CUDA toolkit may not be installed.")
    return None


def check_torch_cuda():
    print("\n" + "=" * 50)
    print("  3. PyTorch CUDA Support")
    print("=" * 50)

    # First check installed version via pip metadata (no import needed)
    try:
        result = subprocess.run(
            [sys.executable, "-m", "pip", "show", "torch"],
            capture_output=True, text=True, timeout=15
        )
        import re
        match = re.search(r"^Version:\s*(.+)", result.stdout, re.MULTILINE)
        if match:
            print(f"  Installed torch        : {match.group(1).strip()}")
    except Exception:
        pass

    # Run the CUDA check in a subprocess with timeout to avoid DLL-load hangs
    # (common on first run with Blackwell / RTX 50-series GPUs)
    torch_script = (
        "import torch; "
        "print('TORCH_VERSION:', torch.__version__); "
        "print('CUDA_BUILTIN:', torch.version.cuda); "
        "print('CUDA_AVAILABLE:', torch.cuda.is_available()); "
        "n=torch.cuda.device_count(); print('DEVICE_COUNT:', n); "
        "[print('DEVICE_NAME:', torch.cuda.get_device_properties(i).name, "
        "'|CC:', str(torch.cuda.get_device_properties(i).major)+'.'+str(torch.cuda.get_device_properties(i).minor), "
        "'|MEM_GB:', round(torch.cuda.get_device_properties(i).total_memory/1024**3,2), "
        "'|MPs:', torch.cuda.get_device_properties(i).multi_processor_count) for i in range(n)]"
    )

    print("  (Running torch import check — may take a moment on first run...)")
    try:
        result = subprocess.run(
            [sys.executable, "-c", torch_script],
            capture_output=True, text=True, timeout=60
        )
        if result.returncode != 0:
            stderr = result.stderr.strip()
            if "ModuleNotFoundError" in stderr or "No module named 'torch'" in stderr:
                print("  ⚠️  PyTorch is not installed.")
                print("     Install: pip install torch --index-url https://download.pytorch.org/whl/cu128")
            else:
                print(f"  ❌ torch import failed:\n     {stderr[-400:]}")
            return False

        output = result.stdout.strip()
        cuda_available = False
        for line in output.split("\n"):
            line = line.strip()
            if line.startswith("TORCH_VERSION:"):
                print(f"  PyTorch version        : {line.split(':', 1)[1].strip()}")
            elif line.startswith("CUDA_BUILTIN:"):
                val = line.split(":", 1)[1].strip()
                print(f"  PyTorch built for CUDA : {val}")
            elif line.startswith("CUDA_AVAILABLE:"):
                val = line.split(":", 1)[1].strip()
                cuda_available = val == "True"
                icon = "✅" if cuda_available else "❌"
                print(f"  CUDA available         : {icon} {val}")
            elif line.startswith("DEVICE_COUNT:"):
                print(f"  CUDA device count      : {line.split(':', 1)[1].strip()}")
            elif line.startswith("DEVICE_NAME:"):
                parts = line.split("|")
                name = parts[0].replace("DEVICE_NAME:", "").strip()
                cc = parts[1].replace("CC:", "").strip() if len(parts) > 1 else "?"
                mem = parts[2].replace("MEM_GB:", "").strip() if len(parts) > 2 else "?"
                mps = parts[3].replace("MPs:", "").strip() if len(parts) > 3 else "?"
                print(f"\n  --- Device: {name} ---")
                print(f"    Compute Capability : {cc}")
                print(f"    Total VRAM         : {mem} GB")
                print(f"    Multi-Processors   : {mps}")

        return cuda_available

    except subprocess.TimeoutExpired:
        print("  ⚠️  torch import timed out (>60s). Possible DLL load issue or first-run initialisation.")
        print("     Try running: python -c \"import torch; print(torch.cuda.is_available())\" manually.")
        return False


def check_tensorflow_cuda():
    print("\n" + "=" * 50)
    print("  4. TensorFlow CUDA Support (optional)")
    print("=" * 50)
    try:
        import tensorflow as tf
        print(f"  TensorFlow version : {tf.__version__}")
        gpus = tf.config.list_physical_devices("GPU")
        if gpus:
            print(f"  ✅ TensorFlow sees {len(gpus)} GPU(s):")
            for gpu in gpus:
                print(f"    {gpu}")
        else:
            print("  ❌ TensorFlow sees no GPUs.")
    except ImportError:
        print("  ℹ️  TensorFlow not installed — skipping.")


def compatibility_verdict(gpus, nvcc_ver, torch_ok):
    print("\n" + "=" * 50)
    print("  5. Compatibility Verdict")
    print("=" * 50)

    if gpus is None:
        print("  ❌ No NVIDIA GPU detected. Cannot train on GPU.")
        return

    # Minimum compute capability for modern training (PyTorch requires >= 3.7)
    MIN_COMPUTE = 3.7
    for gpu in gpus:
        try:
            cap = float(gpu["compute_cap"])
            if cap >= MIN_COMPUTE:
                print(f"  ✅ {gpu['name']} (compute {gpu['compute_cap']}) meets the minimum compute capability ({MIN_COMPUTE}).")
            else:
                print(f"  ❌ {gpu['name']} (compute {gpu['compute_cap']}) is BELOW minimum required ({MIN_COMPUTE}).")
        except ValueError:
            print(f"  ⚠️  Could not parse compute capability for {gpu['name']}.")

    if nvcc_ver:
        print(f"  ✅ CUDA Toolkit {nvcc_ver} found.")
    else:
        print("  ⚠️  CUDA Toolkit (nvcc) not found — needed for custom CUDA ops / compilation.")

    if torch_ok:
        print("  ✅ PyTorch can access the GPU — you are ready to train your model!")
    else:
        print("  ❌ PyTorch cannot access the GPU — fix the issues above before training.")


def run_quick_gpu_test():
    print("\n" + "=" * 50)
    print("  6. Quick GPU Tensor Test (PyTorch)")
    print("=" * 50)
    try:
        import torch
        if not torch.cuda.is_available():
            print("  ⏭️  Skipped (CUDA not available).")
            return
        device = torch.device("cuda")
        a = torch.randn(1000, 1000, device=device)
        b = torch.randn(1000, 1000, device=device)
        c = torch.matmul(a, b)
        torch.cuda.synchronize()
        print(f"  ✅ Matrix multiply (1000x1000) on {torch.cuda.get_device_name(0)} — OK")
        print(f"     Result shape: {c.shape}, dtype: {c.dtype}")
    except Exception as e:
        print(f"  ❌ GPU tensor test failed: {e}")


if __name__ == "__main__":
    print("\n🔍 CUDA Compatibility Check for Model Training\n")
    gpus = check_nvidia_smi()
    nvcc_ver = check_cuda_toolkit()
    torch_ok = check_torch_cuda()
    check_tensorflow_cuda()
    run_quick_gpu_test()
    compatibility_verdict(gpus, nvcc_ver, torch_ok)
    print()
