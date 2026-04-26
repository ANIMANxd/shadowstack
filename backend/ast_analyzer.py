"""
ast_analyzer.py — ShadowStack Code Complexity Analyzer

Parses Python source code using the AST module to extract:
  • Function / method count
  • Loop count (for, while, nested)
  • Branch count (if / elif / else)
  • Cyclomatic complexity (McCabe-style)
  • Complexity score normalised to 1–10
  • Actionable optimisation recommendations

Designed to be called by the FastAPI webhook handler when a
Pull Request is opened / synchronised.
"""

import ast
import math
from dataclasses import dataclass
from typing import List, Optional


@dataclass
class ComplexityReport:
    """Structured output of the AST analysis pass."""
    function_count: int
    loop_count: int
    nested_loop_count: int
    branch_count: int
    cyclomatic_complexity: int
    complexity_score: float          # 1.0 – 10.0
    resource_units: float            # derived heuristic
    recommendations: List[str]       # human-readable advice
    summary: str                     # one-line summary


class _ComplexityVisitor(ast.NodeVisitor):
    """AST visitor that counts structural complexity signals."""

    def __init__(self):
        self.function_count = 0
        self.loop_count = 0
        self.nested_loop_count = 0
        self.branch_count = 0
        self._loop_depth = 0

    def visit_FunctionDef(self, node: ast.FunctionDef):
        self.function_count += 1
        self.generic_visit(node)

    visit_AsyncFunctionDef = visit_FunctionDef  # alias

    def visit_For(self, node: ast.For):
        self._enter_loop()
        self.generic_visit(node)
        self._exit_loop()

    def visit_While(self, node: ast.While):
        self._enter_loop()
        self.generic_visit(node)
        self._exit_loop()

    def _enter_loop(self):
        self.loop_count += 1
        if self._loop_depth >= 1:
            self.nested_loop_count += 1
        self._loop_depth += 1

    def _exit_loop(self):
        self._loop_depth -= 1

    def visit_If(self, node: ast.If):
        self.branch_count += 1
        self.generic_visit(node)

    def visit_IfExp(self, node: ast.IfExp):
        self.branch_count += 1
        self.generic_visit(node)


def _cyclomatic_complexity(source: str) -> int:
    """
    Simple McCabe-style cyclomatic complexity.
    Counts decision points: if, elif, for, while, except, with, assert,
    comprehensions, and boolean operators.
    """
    tree = ast.parse(source)
    decisions = 0

    for node in ast.walk(tree):
        if isinstance(node, (
            ast.If, ast.For, ast.While, ast.ExceptHandler,
            ast.With, ast.Assert, ast.comprehension,
            ast.And, ast.Or
        )):
            decisions += 1
        elif isinstance(node, ast.BoolOp):
            decisions += len(node.values) - 1

    # Base complexity is 1 + decisions
    return 1 + decisions


def analyze_source(source: str) -> ComplexityReport:
    """
    Analyse a single Python source string and return a ComplexityReport.
    """
    try:
        tree = ast.parse(source)
    except SyntaxError as exc:
        # Graceful degradation for malformed / incomplete PR snippets
        return ComplexityReport(
            function_count=0,
            loop_count=0,
            nested_loop_count=0,
            branch_count=0,
            cyclomatic_complexity=1,
            complexity_score=1.0,
            resource_units=10.0,
            recommendations=["⚠️ Could not parse source — syntax error detected."],
            summary="Syntax error in PR code; unable to analyse complexity.",
        )

    visitor = _ComplexityVisitor()
    visitor.visit(tree)

    cyclo = _cyclomatic_complexity(source)

    # Normalise to 1–10 score using a sigmoid-like curve
    raw_score = (
        visitor.function_count * 0.3 +
        visitor.loop_count * 0.8 +
        visitor.nested_loop_count * 2.0 +
        visitor.branch_count * 0.5 +
        cyclo * 0.4
    )
    complexity_score = min(10.0, max(1.0, round(raw_score, 2)))

    # Heuristic resource units: higher complexity → more CPU/RAM
    resource_units = round(50 + complexity_score * 25 + visitor.loop_count * 15, 2)

    # ── Generate Recommendations ─────────────────────────────────────
    recommendations: List[str] = []

    if visitor.nested_loop_count > 0:
        recommendations.append(
            f"🔴 **Refactor nested loops** — {visitor.nested_loop_count} nested loop(s) detected. "
            "Consider vectorisation (NumPy/Pandas) or algorithmic optimisation. "
            f"Estimated savings: **~${visitor.nested_loop_count * 45:.0f}/month**."
        )

    if visitor.loop_count > 5:
        recommendations.append(
            f"🟡 **Reduce loop density** — {visitor.loop_count} total loops. "
            "Batch operations where possible to cut compute hours."
        )

    if cyclo > 10:
        recommendations.append(
            f"🟡 **Lower cyclomatic complexity** — score is {cyclo}. "
            "Split large functions into smaller, testable units to reduce runtime paths."
        )

    if visitor.branch_count > 8:
        recommendations.append(
            f"🟡 **Simplify branching logic** — {visitor.branch_count} branches. "
            "Use lookup tables or polymorphism instead of deep if/else chains."
        )

    if visitor.function_count > 15:
        recommendations.append(
            f"🟢 **High modularity** — {visitor.function_count} functions. "
            "Good separation, but ensure cold-start overhead doesn't outweigh benefits in serverless deployments."
        )

    if not recommendations:
        recommendations.append(
            "🟢 **Clean codebase** — low complexity detected. "
            "No major cost optimisations required; maintain current patterns."
        )

    summary = (
        f"AST analysis: {visitor.function_count} functions, {visitor.loop_count} loops "
        f"({visitor.nested_loop_count} nested), {visitor.branch_count} branches, "
        f"cyclomatic complexity {cyclo}."
    )

    return ComplexityReport(
        function_count=visitor.function_count,
        loop_count=visitor.loop_count,
        nested_loop_count=visitor.nested_loop_count,
        branch_count=visitor.branch_count,
        cyclomatic_complexity=cyclo,
        complexity_score=complexity_score,
        resource_units=resource_units,
        recommendations=recommendations,
        summary=summary,
    )


def analyze_files(file_sources: List[str]) -> ComplexityReport:
    """
    Analyse multiple file sources (e.g. all changed files in a PR) and
    return an *aggregated* ComplexityReport.
    """
    reports = [analyze_source(src) for src in file_sources]

    total_functions = sum(r.function_count for r in reports)
    total_loops = sum(r.loop_count for r in reports)
    total_nested = sum(r.nested_loop_count for r in reports)
    total_branches = sum(r.branch_count for r in reports)
    total_cyclo = sum(r.cyclomatic_complexity for r in reports)

    # Average complexity score across files, capped at 10
    avg_score = min(10.0, sum(r.complexity_score for r in reports) / max(len(reports), 1))
    complexity_score = round(avg_score, 2)

    # Sum resource units
    resource_units = round(sum(r.resource_units for r in reports), 2)

    # Merge recommendations, deduplicate by first 20 chars
    seen = set()
    all_recs = []
    for r in reports:
        for rec in r.recommendations:
            key = rec[:20]
            if key not in seen:
                seen.add(key)
                all_recs.append(rec)

    summary = (
        f"Aggregated across {len(reports)} file(s): {total_functions} functions, "
        f"{total_loops} loops ({total_nested} nested), {total_branches} branches, "
        f"total cyclomatic complexity {total_cyclo}."
    )

    return ComplexityReport(
        function_count=total_functions,
        loop_count=total_loops,
        nested_loop_count=total_nested,
        branch_count=total_branches,
        cyclomatic_complexity=total_cyclo,
        complexity_score=complexity_score,
        resource_units=resource_units,
        recommendations=all_recs[:5],   # cap at 5 recommendations
        summary=summary,
    )


# ── Stand-alone CLI test ─────────────────────────────────────────────────────
if __name__ == "__main__":
    sample = '''
def process_data(items):
    total = 0
    for i in range(len(items)):
        for j in range(len(items)):
            if items[i] > items[j]:
                total += items[i] * items[j]
            elif items[i] == items[j]:
                total += items[i]
    return total

def helper():
    x = 1
    while x < 100:
        x *= 2
    return x
'''
    report = analyze_source(sample)
    print("=== ShadowStack AST Analysis ===")
    print(report.summary)
    print(f"Complexity Score: {report.complexity_score}/10")
    print(f"Resource Units:   {report.resource_units}")
    print("Recommendations:")
    for rec in report.recommendations:
        print(f"  - {rec}")
