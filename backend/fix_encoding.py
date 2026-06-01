import re
import sys

# Fix emoji encoding in main.py
with open('main.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace emoji in print statements
replacements = {
    'print("??': 'print("[START]',
    'print(f"??': 'print(f"[MODEL]',
    'print("??': 'print("[DB]',
    'print("??': 'print("[SYNC]',
    'print("??': 'print("[AGENTS]',
    'print("?': 'print("[OK]',
    'print(f"??': 'print(f"[READY]',
    'print("??': 'print("[SHUTDOWN]',
    'print(f"??': 'print(f"[WARN]',
}

for old, new in replacements.items():
    content = content.replace(old, new)

with open('main.py', 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed encoding in main.py")
