import frappe

def create_doctype(name, module, fields, is_submittable=0):
    if not frappe.db.exists("DocType", name):
        doc = frappe.get_doc({
            "doctype": "DocType",
            "name": name,
            "module": module,
            "custom": 1,
            "autoname": "field:mould_name" if name == "Mould Master" else "autoincrement",
            "is_submittable": is_submittable,
            "fields": fields
        })
        if name != "Mould Master":
            doc.autoname = "autoincrement"
        doc.insert(ignore_permissions=True)
        print(f"Created DocType: {name}")
    else:
        print(f"DocType {name} already exists.")

def execute():
    try:
        frappe.flags.ignore_permissions = True
        module = "Shakti Manufacturing"

        # 1. Mould Master
        create_doctype("Mould Master", module, [
            {"fieldname": "mould_name", "label": "Mould Name", "fieldtype": "Data", "reqd": 1, "unique": 1},
            {"fieldname": "mould_code", "label": "Mould Code", "fieldtype": "Data"},
            {"fieldname": "product", "label": "Product It Makes", "fieldtype": "Link", "options": "Item"},
            {"fieldname": "assigned_machine", "label": "Currently Assigned Machine", "fieldtype": "Link", "options": "Workstation"},
            {"fieldname": "lifetime_shots", "label": "Total Lifetime Shots", "fieldtype": "Int", "default": "0"},
            {"fieldname": "shots_since_maintenance", "label": "Shots Since Last Maintenance", "fieldtype": "Int", "default": "0"},
            {"fieldname": "last_maintenance_date", "label": "Last Maintenance Date", "fieldtype": "Date"},
            {"fieldname": "next_maintenance_date", "label": "Next Maintenance Due Date", "fieldtype": "Date"},
            {"fieldname": "maintenance_interval", "label": "Maintenance Interval (shots)", "fieldtype": "Int"},
            {"fieldname": "status", "label": "Status", "fieldtype": "Select", "options": "Active\nUnder Maintenance\nRetired", "default": "Active"},
            {"fieldname": "notes", "label": "Notes", "fieldtype": "Text"}
        ])

        # 2. Mould Maintenance Log
        create_doctype("Mould Maintenance Log", module, [
            {"fieldname": "mould", "label": "Mould", "fieldtype": "Link", "options": "Mould Master", "reqd": 1},
            {"fieldname": "maintenance_date", "label": "Maintenance Date", "fieldtype": "Date", "reqd": 1},
            {"fieldname": "maintenance_type", "label": "Maintenance Type", "fieldtype": "Select", "options": "Scheduled\nEmergency", "reqd": 1},
            {"fieldname": "work_done", "label": "Work Done", "fieldtype": "Text"},
            {"fieldname": "done_by", "label": "Done By", "fieldtype": "Data"},
            {"fieldname": "shots_at_maintenance", "label": "Shots at Time of Maintenance", "fieldtype": "Int"},
            {"fieldname": "next_due_date", "label": "Next Due Date", "fieldtype": "Date"},
            {"fieldname": "attachments", "label": "Attachments", "fieldtype": "Attach"}
        ])

        # 3. Shift Production Entry (Submittable)
        create_doctype("Shift Production Entry", module, [
            {"fieldname": "date", "label": "Date", "fieldtype": "Date", "reqd": 1, "default": "Today"},
            {"fieldname": "shift", "label": "Shift", "fieldtype": "Select", "options": "Morning\nEvening\nNight", "reqd": 1},
            {"fieldname": "unit", "label": "Unit", "fieldtype": "Select", "options": "Unit 1\nUnit 2", "reqd": 1},
            {"fieldname": "machine", "label": "Machine", "fieldtype": "Link", "options": "Workstation", "reqd": 1},
            {"fieldname": "mould_used", "label": "Mould Used", "fieldtype": "Link", "options": "Mould Master", "reqd": 1},
            {"fieldname": "product", "label": "Product Being Made", "fieldtype": "Link", "options": "Item", "reqd": 1},
            {"fieldname": "operator_name", "label": "Operator Name", "fieldtype": "Data"},
            {"fieldname": "start_time", "label": "Start Time", "fieldtype": "Time"},
            {"fieldname": "end_time", "label": "End Time", "fieldtype": "Time"},
            {"fieldname": "raw_material", "label": "Raw Material Used", "fieldtype": "Link", "options": "Item"},
            {"fieldname": "batch_number", "label": "Raw Material Batch Number", "fieldtype": "Data"},
            {"fieldname": "quantity_consumed", "label": "Raw Material Quantity Consumed", "fieldtype": "Float"},
            {"fieldname": "pieces_produced", "label": "Pieces Produced", "fieldtype": "Int", "reqd": 1},
            {"fieldname": "pieces_rejected", "label": "Pieces Rejected", "fieldtype": "Int", "default": "0"},
            {"fieldname": "rejection_reason", "label": "Rejection Reason", "fieldtype": "Select", "options": "\nMaterial Defect\nMould Issue\nMachine Issue\nOperator Error\nOther"},
            {"fieldname": "mould_change", "label": "Mould Change During Shift", "fieldtype": "Select", "options": "No\nYes", "default": "No"},
            {"fieldname": "notes", "label": "Notes", "fieldtype": "Text"}
        ], is_submittable=1)

        # 4. Machine Breakdown Log
        create_doctype("Machine Breakdown Log", module, [
            {"fieldname": "machine", "label": "Machine", "fieldtype": "Link", "options": "Workstation", "reqd": 1},
            {"fieldname": "unit", "label": "Unit", "fieldtype": "Select", "options": "Unit 1\nUnit 2"},
            {"fieldname": "reported_by", "label": "Reported By", "fieldtype": "Data"},
            {"fieldname": "breakdown_datetime", "label": "Breakdown Date and Time", "fieldtype": "Datetime", "reqd": 1},
            {"fieldname": "issue_description", "label": "Issue Description", "fieldtype": "Text"},
            {"fieldname": "resolution_datetime", "label": "Resolution Date and Time", "fieldtype": "Datetime"},
            {"fieldname": "resolved_by", "label": "Resolved By", "fieldtype": "Data"},
            {"fieldname": "downtime_hours", "label": "Downtime Hours", "fieldtype": "Float"},
            {"fieldname": "action_taken", "label": "Action Taken", "fieldtype": "Text"},
            {"fieldname": "status", "label": "Status", "fieldtype": "Select", "options": "Open\nResolved", "default": "Open"}
        ])

        frappe.db.commit()
        print("PART5_DOCTYPES_CREATED")
    except Exception as e:
        frappe.db.rollback()
        import traceback
        traceback.print_exc()
        print(f"Error: {e}")
