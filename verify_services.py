"""
Quick verification script to check if all services are accessible on their configured ports.
Run this after starting all services to verify the setup.
"""

import requests
import sys

def check_service(name, url, expected_status=None):
    """Check if a service is accessible."""
    try:
        response = requests.get(url, timeout=2)
        if expected_status is None or response.status_code == expected_status:
            print(f"✓ {name} is accessible at {url}")
            return True
        else:
            print(f"✗ {name} returned status {response.status_code} (expected {expected_status})")
            return False
    except requests.exceptions.ConnectionError:
        print(f"✗ {name} is NOT accessible at {url} - Connection refused")
        return False
    except requests.exceptions.Timeout:
        print(f"✗ {name} timed out at {url}")
        return False
    except Exception as e:
        print(f"✗ {name} error: {e}")
        return False

def main():
    print("BookShare Multi-Service Verification")
    print("=" * 50)
    print()
    
    services = [
        ("Auth Service", "http://localhost:8001/docs", 200),
        ("Backend Service", "http://localhost:8000/docs", 200),
        ("Frontend", "http://localhost:5173", None),
    ]
    
    results = []
    for name, url, status in services:
        result = check_service(name, url, status)
        results.append(result)
        print()
    
    print("=" * 50)
    if all(results):
        print("✓ All services are running successfully!")
        print("\nYou can now access the application at:")
        print("  → http://localhost:5173")
        return 0
    else:
        print("✗ Some services are not running.")
        print("\nPlease check:")
        print("  1. All services are started in separate terminals")
        print("  2. No port conflicts exist")
        print("  3. See SETUP.md for troubleshooting")
        return 1

if __name__ == "__main__":
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        print("\n\nVerification cancelled.")
        sys.exit(1)
