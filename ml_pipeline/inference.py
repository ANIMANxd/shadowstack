import pandas as pd
import joblib
import os

def predict_pr_cost(complexity_score, resource_units, service_name, resource_type):
    """
    Simulates the ShadowStack FastAPI endpoint receiving PR metrics.
    """
    # 1. FIXED PATH: Look directly in the models/ folder from the current directory
    pipeline_path = 'models/feature_pipeline2.pkl' 
    
    if not os.path.exists(pipeline_path):
        print(f"❌ Error: Model not found at {pipeline_path}. Check your folder structure!")
        return None

    pipeline = joblib.load(pipeline_path)

    # 2. Format the incoming data into a DataFrame
    input_data = pd.DataFrame([{
        'complexity_score': complexity_score,
        'resource_units': resource_units,
        'complexity_x_units': complexity_score * resource_units,
        'service_name': service_name,
        'resource_type': resource_type
    }])

    # 3. Make the prediction
    predicted_cost = pipeline.predict(input_data)[0]
    return predicted_cost

if __name__ == "__main__":
    print("🚀 Booting up ShadowStack Inference Engine...\n")

    # Test Case 1: A simple frontend API update
    cost_1 = predict_pr_cost(2.5, 100.0, 'compute', 't3.micro')
    if cost_1 is not None:
        print(f"🟢 PR #101 (Simple API Update on t3.micro):")
        print(f"   Estimated Cost: ${cost_1:.2f}\n")

    # Test Case 2: A massive AI Model Deployment
    cost_2 = predict_pr_cost(9.5, 500.0, 'compute', 'p3.2xlarge')
    if cost_2 is not None:
        print(f"🔴 PR #102 (Heavy AI Workload on p3.2xlarge):")
        print(f"   Estimated Cost: ${cost_2:.2f}\n")
    
    # Test Case 3: A database migration
    cost_3 = predict_pr_cost(5.0, 250.0, 'database', 'RDS-postgres')
    if cost_3 is not None:
        print(f"🟡 PR #103 (Database Migration on RDS):")
        print(f"   Estimated Cost: ${cost_3:.2f}\n")