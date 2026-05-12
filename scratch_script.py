import json

with open("data.json", "r") as f:
    data = json.load(f)

print("Keys at root level:")
print(list(data.keys()))

def extract_categories(lst):
    cats = set()
    for item in lst:
        class_name = item.get("SubjectClassName")
        c_name = item.get("SubjectCName")
        cats.add(f"{class_name} - {c_name}")
    return cats

if "IdenticalSubjects_List" in data:
    print("\nIdenticalSubjects_List categories:")
    for c in list(extract_categories(data["IdenticalSubjects_List"]))[:5]: print(c)

if "RequiredSubjects_List" in data:
    print("\nRequiredSubjects_List categories:")
    for c in list(extract_categories(data["RequiredSubjects_List"]))[:5]: print(c)

if "ElectiveSubjects_List" in data:
    print("\nElectiveSubjects_List categories:")
    for c in list(extract_categories(data["ElectiveSubjects_List"]))[:5]: print(c)
