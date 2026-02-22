import frappe

def execute():
    try:
        frappe.flags.ignore_permissions = True
        module = "Shakti Manufacturing"
        
        if not frappe.db.exists("Page", "Shakti Owner Dashboard"):
            frappe.get_doc({
                "doctype": "Page",
                "page_name": "Shakti Owner Dashboard",
                "title": "Shakti Owner Dashboard",
                "module": module,
                "standard": "Yes",
                "roles": [{"role": "System Manager"}]
            }).insert(ignore_permissions=True)
            print("Created Custom Page: Shakti Owner Dashboard")
        else:
            print("Page already exists.")
            
        frappe.db.commit()
    except Exception as e:
        frappe.db.rollback()
        import traceback
        traceback.print_exc()
        print(f"Error: {e}")
