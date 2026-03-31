try:
    import pandas
    print("pandas found")
except ImportError:
    print("pandas NOT found")

try:
    import openpyxl
    print("openpyxl found")
except ImportError:
    print("openpyxl NOT found")
