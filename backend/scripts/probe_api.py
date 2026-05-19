import requests
import urllib3
import json

urllib3.disable_warnings()

def probe_sis_api(username, password):
    session = requests.Session()
    login_url = "https://travellerlink.fju.edu.tw/FjuBase/api/Account/LdapLogin"
    
    headers = {
        "Content-Type": "application/json",
        "Origin": "https://sis.fju.edu.tw",
        "Referer": "https://sis.fju.edu.tw/",
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
    
    # 1. Login to get token
    payload = {"empNo": username, "password": password, "systemSn": 31}
    print(f"Logging in to SIS...")
    login_resp = session.post(login_url, json=payload, headers=headers, verify=False)
    
    if login_resp.status_code != 200:
        print(f"Login failed: {login_resp.text}")
        return
        
    auth_token = login_resp.json()["result"]["auth_token"]
    print(f"Token obtained: {auth_token[:20]}...")
    
    api_headers = {
        "Authorization": f"Bearer {auth_token}",
        "Accept": "application/json",
        "User-Agent": headers["User-Agent"]
    }
    
    # 2. Define potential endpoints to probe
    base_url = "https://travellerlink.fju.edu.tw/Score/api"
    endpoints = [
        "/GradesInquiry/Grades", # Known
        "/GradesInquiry/GraduationProgress",
        "/GradesInquiry/GraduationAudit",
        "/GradesInquiry/Requirements",
        "/GradesInquiry/AuditSummary",
        "/GradesInquiry/CreditStatus",
        "/Graduation/Audit",
        "/Graduation/Status",
        "/Student/Requirement",
        "/Audit/Summary",
        "/Common/DeptRules"
    ]
    
    print("\nStarting API Probe...")
    results = {}
    for ep in endpoints:
        full_url = f"{base_url}{ep}"
        print(f"Testing: {full_url}", end=" ")
        try:
            resp = session.get(full_url, headers=api_headers, verify=False, timeout=5)
            print(f"-> {resp.status_code}")
            if resp.status_code == 200:
                results[ep] = resp.json()
                print(f"   [FOUND DATA at {ep}!]")
        except Exception as e:
            print(f"-> Error: {e}")
            
    if results:
        print("\n--- PROBE RESULTS ---")
        for ep, data in results.items():
            print(f"Endpoint: {ep}")
            print(json.dumps(data, indent=2, ensure_ascii=False)[:1000]) # Print first 1000 chars
            with open(f"probe_{ep.replace('/', '_')}.json", "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
    else:
        print("\nNo new endpoints found in the Score API namespace.")

if __name__ == "__main__":
    probe_sis_api("413401223", "By775come733")
