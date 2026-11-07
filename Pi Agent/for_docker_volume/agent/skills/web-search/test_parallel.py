import time
import subprocess

def run_test(query, test_name):
    print(f"\n{'='*60}")
    print(f"Testing: {test_name}")
    print(f"Query: {query}")
    print(f"{'='*60}")
    
    # Test sequential execution
    start_time = time.time()
    subprocess.run(["python", "search.py", "--answer", query], cwd=".")
    subprocess.run(["python", "search.py", "--search", query], cwd=".")
    sequential_time = time.time() - start_time
    print(f"\nSequential execution time: {sequential_time:.2f}s")
    
    # Test parallel execution
    start_time = time.time()
    subprocess.run(["python", "search.py", query], cwd=".")
    parallel_time = time.time() - start_time
    print(f"Parallel execution time: {parallel_time:.2f}s")
    
    # Performance comparison
    print("\nPerformance Comparison:")
    print(f"• Speedup: {sequential_time/parallel_time:.2f}x faster")
    print(f"• Time saved: {sequential_time - parallel_time:.2f}s")

if __name__ == "__main__":
    # Test with a query that should work with both search modes
    test_query = "llama.cpp Turboquant activity"
    run_test(test_query, "EXA API Parallel vs Sequential")