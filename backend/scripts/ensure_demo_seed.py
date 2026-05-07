import os
import sys
import subprocess

def ensure_seed():
    db_path = "operio_demo.db"
    
    # Check if database file exists
    if os.path.exists(db_path):
        print(f"Database {db_path} already exists. Skipping seed.")
        return

    print(f"Database {db_path} not found. Running demo seed...")
    
    try:
        # Run the seed_demo module
        # We assume we are in the backend directory
        subprocess.run([sys.executable, "-m", "app.seed.seed_demo"], check=True)
        print("Demo seed completed successfully.")
    except subprocess.CalledProcessError as e:
        print(f"Error during demo seed: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        sys.exit(1)

if __name__ == "__main__":
    ensure_seed()
