import pandas as pd
import pdfplumber
import re
from datetime import datetime

class TimetableParser:
    DAYS_MAP = {
        'MON': 'Monday', 'TUE': 'Tuesday', 'WED': 'Wednesday', 
        'THU': 'Thursday', 'FRI': 'Friday', 'SAT': 'Saturday', 'SUN': 'Sunday',
        'MONDAY': 'Monday', 'TUESDAY': 'Tuesday', 'WEDNESDAY': 'Wednesday',
        'THURSDAY': 'Thursday', 'FRIDAY': 'Friday', 'SATURDAY': 'Saturday'
    }

    @staticmethod
    def parse_excel(file_path):
        """
        Robustly parses an Excel timetable following production-ready standards.
        Handles merged cells, multiline content, and intelligent header detection.
        """
        # Step 1: Safe File Loading
        try:
            print(f"DEBUG: Reading Excel file: {file_path}")
            # Explicitly specify openpyxl engine for .xlsx files
            df = pd.read_excel(file_path, header=None, engine='openpyxl')
            print("-" * 30)
            print(f"DEBUG: PROCESSING EXCEL: {file_path}")
            print(f"DEBUG: Shape: {df.shape}")
            print(df.head())
            print("-" * 30)
        except Exception as e:
            print(f"DEBUG ERROR: Failed to read excel: {str(e)}")
            raise ValueError(f"Invalid Excel file (engine: openpyxl): {str(e)}")

        if df.empty:
            raise ValueError("Empty file")

        # Step 2: Handle Merged Cells (Horizontal then Vertical)
        # axis=1 for horizontal merges, axis=0 for vertical merges
        df = df.fillna(method='ffill', axis=1)
        df = df.fillna(method='ffill', axis=0)

        # Step 3: Remove Useless Rows
        # Remove fully empty rows
        df = df.dropna(how='all')
        # Remove rows containing only "----"
        df = df[~df.apply(lambda x: x.astype(str).str.contains('----').all(), axis=1)]

        # Step 4: Detect Time Header Row
        time_slot_row_index = -1
        time_slots_row = []
        
        # Regex for time slots like 9:00, 10:00-11:00, or 9:00-10:00 (user specified r"\d{1,2}:\d{2}")
        # Improved regex to handle slots even if they lack colons like 9-10
        time_regex = r"\d{1,2}(?::\d{2})?"
        
        for idx, row in df.iterrows():
            matches = row.astype(str).apply(lambda x: bool(re.search(time_regex, x)))
            # A time header row usually has multiple slots like "9:00-10:00"
            if matches.sum() >= 2:
                # Double check if it actually looks like a time header (contains '-' or ':' in multiple cells)
                potential_slots = row.astype(str).apply(lambda x: bool(re.search(r"\d{1,2}(?::\d{2})?\s*[-–]\s*\d{1,2}", x)))
                if potential_slots.sum() >= 2:
                    time_slot_row_index = idx
                    time_slots_row = row.tolist()
                    break
        
        if time_slot_row_index == -1:
            raise ValueError("No time slots found: Format should contain slots like '9:45-10:45'")

        # Step 5: Detect Day Column
        day_col_index = -1
        days_to_find = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']
        
        for col_idx in range(df.shape[1]):
            matches = df.iloc[:, col_idx].astype(str).str.upper().apply(lambda x: x.strip() in days_to_find)
            if matches.sum() >= 1: 
                day_col_index = col_idx
                break
        
        if day_col_index == -1:
             raise ValueError("Invalid timetable format: No Day column (MON, TUE, etc.) found")

        # Step 6-10: Parse content and save entries
        entries = []
        
        for idx, row in df.iterrows():
            # Skip the row if it's the header itself
            if idx == time_slot_row_index:
                continue
                
            day_raw = str(row[day_col_index]).strip().upper()
            day = TimetableParser._map_day(day_raw) # Normalized to MONDAY, TUESDAY...
            if not day:
                continue

            for col_idx, cell in enumerate(row):
                # Skip columns before or at the day column
                if col_idx <= day_col_index:
                    continue
                
                # Get the time slot for this column
                slot_raw = str(time_slots_row[col_idx])
                times = re.findall(r'(\d{1,2}(?::\d{2})?)', slot_raw)
                if len(times) < 2:
                    continue
                
                # Normalize time (9 -> 09:00)
                def normalize_time(t):
                    if ':' not in t: 
                        return f"{int(t):02d}:00"
                    h, m = t.split(':')
                    return f"{int(h):02d}:{m}"
                
                try:
                    start_time = normalize_time(times[0])
                    end_time = normalize_time(times[1])
                except:
                    continue

                # Step 6: Parse Cell Content (split by newline and space)
                cell_str = str(cell).strip()
                
                # Step 8: Skip Invalid Cells
                if not cell_str or cell_str.upper() in ['NAN', '----', 'BREAK', 'RECESS', 'LUNCH', 'EMPTY']:
                    continue
                
                # Step 9: Debug Logging (Mandatory)
                print(f"Day: {day}")
                print(f"Time: {start_time}–{end_time}")
                print(f"Raw: \"{cell_str}\"")

                # Extract using regex (case-insensitive for code/batch)
                subject_code_match = re.search(r'[A-Z]{2,5}', cell_str.upper())
                batch_match = re.search(r'B\d+', cell_str.upper())
                room_match = re.search(r'\d{3,4}', cell_str)
                
                subject_code = subject_code_match.group(0) if subject_code_match else ""
                batch = batch_match.group(0) if batch_match else ""
                room = room_match.group(0) if room_match else ""

                if not subject_code or subject_code in ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']:
                    continue

                # Step 7: Handle Practical (Detect 'L' suffix)
                is_lab = subject_code.endswith('L')
                subject_type = 'PRACTICAL' if is_lab else 'THEORY'

                print(f"Parsed: Subject: {subject_code}, Type: {subject_type}, Batch: {batch}, Room: {room}")
                print("-" * 10)

                # Merge consecutive slots (Practical 2h slots)
                # If the same subject/batch exists right before this slot on the same day
                existing_entry = None
                for entry in entries:
                    if (entry['day'] == day and 
                        entry['subject_code'] == subject_code and 
                        entry['batch'] == batch and
                        entry['end_time'] == start_time):
                        existing_entry = entry
                        break
                
                if existing_entry:
                    existing_entry['end_time'] = end_time
                else:
                    entries.append({
                        'day': day,
                        'start_time': start_time,
                        'end_time': end_time,
                        'subject_code': subject_code,
                        'subject_type': subject_type.lower(),
                        'division': 'TE-A', # Default division as per current system
                        'batch': batch,
                        'room': room
                    })
        
        return entries

    @staticmethod
    def _map_day(day_raw):
        return TimetableParser.DAYS_MAP.get(day_raw.strip().upper())

    @staticmethod
    def parse_pdf(file_path):
        """
        Parses a PDF timetable using pdfplumber to extract tables.
        """
        entries = []
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                tables = page.extract_tables()
                for table in tables:
                    if not table or len(table) < 2:
                        continue
                    
                    # Convert table to DataFrame
                    header = table[0]
                    data = table[1:]
                    df = pd.DataFrame(data, columns=header)
                    
                    # Set first column as index (Days)
                    day_col = header[0]
                    df.set_index(day_col, inplace=True)
                    
                    entries.extend(TimetableParser._process_dataframe(df))
        return entries

    @staticmethod
    def _process_dataframe(df):
        entries = []
        # Normalizing index and headers
        df.index = [str(i).strip().upper() for i in df.index]
        df.columns = [str(c).strip().upper() for c in df.columns]
        
        # Mapping slots to detect duration
        time_slot_list = list(df.columns)
        
        for day_raw, row in df.iterrows():
            day = TimetableParser._map_day(day_raw)
            if not day:
                continue

            # Tracking processed slots for merged cell handling (Labs)
            skip_next = False
            
            for i, (slot_raw, cell) in enumerate(row.items()):
                if skip_next:
                    skip_next = False
                    continue

                if pd.isna(cell) or not str(cell).strip():
                    continue
                
                # Parse time: "9-10" or "9:00 - 10:00"
                times = re.findall(r'(\d{1,2}(?::\d{2})?)', str(slot_raw))
                if len(times) < 2:
                    continue
                
                # Normalize time format to HH:MM
                def norm_t(t):
                    if t and ':' not in t: return f"{t}:00"
                    return t
                
                start_time = norm_t(times[0])
                end_time = norm_t(times[1])
                
                # Intelligent Regex Parsing
                cell_str = str(cell).strip().upper()
                
                subject_match = re.search(r'^[A-Z0-9]+', cell_str)
                batch_match = re.search(r'B[0-9]+', cell_str)
                room_match = re.search(r'[0-9]{3,4}', cell_str)
                
                if not subject_match:
                    continue
                
                subject_code = subject_match.group(0)
                is_lab = subject_code.endswith('L')
                subject_type = 'Practical' if is_lab else 'Theory'
                
                if is_lab:
                    if i + 1 < len(time_slot_list):
                        next_slot = time_slot_list[i+1]
                        next_times = re.findall(r'(\d{1,2}(?::\d{2})?)', str(next_slot))
                        if len(next_times) >= 2:
                            end_time = norm_t(next_times[1])
                            skip_next = True

                entries.append({
                    'day': day,
                    'start_time': start_time,
                    'end_time': end_time,
                    'subject_code': subject_code,
                    'subject_type': subject_type.lower(),
                    'division': 'TE-A',
                    'batch': batch_match.group(0) if batch_match else '',
                    'room': room_match.group(0) if room_match else ''
                })
        
        return entries

    @staticmethod
    def parse_syllabus(file_path):
        """
        Parses an Excel syllabus.
        Expects columns: Chapter Name, CO, No. of Lectures Required, Lecture No, Topics.
        Handles merged cells and lecture ranges (e.g., 23-25).
        """
        df = pd.read_excel(file_path)
        
        # Clean column names
        df.columns = [str(c).strip() for c in df.columns]
        
        # Mapping rules
        col_map = {
            'chapter_name': ['Chapter Name', 'Chapter', 'Unit', 'Module'],
            'co': ['COs Covered', 'CO', 'Course Outcome'],
            'lecture_count': ['No. of Lectures Required', 'Total Lectures', 'Count'],
            'lecture_no': ['Lecture No', 'Lec No', 'Sr No'],
            'topic_name': ['Topics', 'Topic Name', 'Syllabus Topic']
        }
        
        def find_col(possible_names):
            for name in possible_names:
                for actual in df.columns:
                    if name.lower() in actual.lower():
                        return actual
            return None

        actual_cols = {k: find_col(v) for k, v in col_map.items()}
        
        # Handle merged cells for Chapter and CO
        for key in ['chapter_name', 'co', 'lecture_count']:
            if actual_cols[key]:
                df[actual_cols[key]] = df[actual_cols[key]].ffill()

        entries = []
        for _, row in df.iterrows():
            topic = str(row.get(actual_cols['topic_name'], '')).strip()
            if not topic or topic.lower() == 'nan':
                continue
            
            chapter = str(row.get(actual_cols['chapter_name'], 'Unknown')).strip()
            co = str(row.get(actual_cols['co'], '')).strip()
            
            count_raw = row.get(actual_cols['lecture_count'], 1)
            try:
                count = int(float(count_raw))
            except:
                count = 1

            lec_raw = str(row.get(actual_cols['lecture_no'], '')).strip()

            # Handle Lecture Range (e.g., 23-25)
            range_match = re.search(r'(\d+)\s*[-–]\s*(\d+)', lec_raw)
            if range_match:
                start, end = int(range_match.group(1)), int(range_match.group(2))
                for i in range(start, end + 1):
                    entries.append({
                        'chapter_name': chapter,
                        'co': co,
                        'lecture_count': count,
                        'lecture_number': i,
                        'topic_name': topic
                    })
            else:
                lec_no_match = re.search(r'(\d+)', lec_raw)
                if lec_no_match:
                    lec_no = int(lec_no_match.group(1))
                else:
                    lec_no = (entries[-1]['lecture_number'] + 1) if entries else 1
                
                entries.append({
                    'chapter_name': chapter,
                    'co': co,
                    'lecture_count': count,
                    'lecture_number': lec_no,
                    'topic_name': topic
                })

        return entries

    @staticmethod
    def parse_practical(file_path):
        """
        Parses an Excel experiment sheet.
        Expects columns: Experiment No, Experiment Name/Title.
        """
        df = pd.read_excel(file_path)
        
        # Cleaning and Metadata detection
        df.columns = [str(c).strip() for c in df.columns]
        
        # Check for optional components
        has_assignments = any('assignment' in c.lower() for c in df.columns)
        has_mini_project = any('mini' in c.lower() and 'project' in c.lower() for c in df.columns)

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
        
        if not actual_cols['title']:
            # Fallback if no specific title column: use the longest text column that isn't the index
            text_cols = df.select_dtypes(include=['object']).columns
            if len(text_cols) > 0:
                actual_cols['title'] = text_cols[0]

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


