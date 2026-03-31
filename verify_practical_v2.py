import pandas as pd
import re

def mock_parse_practical(df):
    # Cleaning and Metadata detection
    df.columns = [str(c).strip() for c in df.columns]
    
    # Check for optional components
    has_assignments = any('assignment' in c.lower() for c in df.columns)
    has_mini_project = any('mini' in c.lower() and 'project' in c.lower() for c in df.columns)

    print(f"Detected has_assignments: {has_assignments}")
    print(f"Detected has_mini_project: {has_mini_project}")

    # Mapping rules for Practical/Lab
    col_map = {
        'exp_no': ['Experiment No', 'Exp No', 'Sr No', 'No', '#'],
        'title': ['Experiment Name', 'Experiment Title', 'Name of Experiment', 'Title', 'Experiment', 'Name']
    }
    
    def find_col(possible_names):
        for name in possible_names:
            for actual in df.columns:
                if name.lower() in actual.lower():
                    return actual
        return None

    actual_cols = {k: find_col(v) for k, v in col_map.items()}
    
    entries = []
    for _, row in df.iterrows():
        title = str(row.get(actual_cols['title'], '')).strip()
        if not title or title.lower() == 'nan' or len(title) < 3:
            continue
        
        exp_no_raw = str(row.get(actual_cols['exp_no'], '')).strip()
        exp_no_match = re.search(r'(\d+)', exp_no_raw)
        if exp_no_match:
            exp_no = int(exp_no_match.group(1))
        else:
            exp_no = (entries[-1]['experiment_number'] + 1) if entries else 1
        
        entries.append({
            'experiment_number': exp_no,
            'title': title
        })

    return {
        "entries": entries,
        "has_assignments": has_assignments,
        "has_mini_project": has_mini_project
    }

# Test Case 1: All present
df1 = pd.DataFrame({
    'Exp No': [1, 2],
    'Title': ['Lab 1', 'Lab 2'],
    'Assignment 1': [0, 0],
    'Mini Project': [0, 0]
})
print("Test Case 1:")
print(mock_parse_practical(df1))

# Test Case 2: Only experiments
df2 = pd.DataFrame({
    'Sr No': [1],
    'Name': ['Solo Lab']
})
print("\nTest Case 2:")
print(mock_parse_practical(df2))
