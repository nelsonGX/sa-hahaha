import json

with open("data.json", "r") as f:
    data = json.load(f)

def print_sample(lst_name):
    print(f"\n--- {lst_name} ---")
    if lst_name in data:
        for i, item in enumerate(data[lst_name][:3]):
            class_name = item.get("SubjectClassName", "N/A")
            c_name = item.get("SubjectCName", "N/A")
            scores = [s.get("ScorePass") for s in item.get("ScoreList", [])]
            print(f"[{i}] Class: {class_name}, Subject: {c_name}, ScorePass: {scores}")
            if "Credits" in item: print(f"    Credits: {item['Credits']}")
            elif "TotalCredit" in item: print(f"    TotalCredit: {item['TotalCredit']}")
            else: print(f"    Item keys: {list(item.keys())}")

print_sample("ModuleSubjects_List")
print_sample("NoMatchSubject_List")
print_sample("RecognizeSubject_List")
