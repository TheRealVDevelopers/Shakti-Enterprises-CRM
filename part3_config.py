import frappe

def execute():
    print("Starting Initial Configuration...")

    # 1. Update System Settings
    system_settings = frappe.get_doc("System Settings")
    system_settings.time_zone = "Asia/Kolkata"
    system_settings.date_format = "dd-mm-yyyy"
    system_settings.first_day_of_the_week = "Monday"
    system_settings.save(ignore_permissions=True)
    print("-> System Settings updated.")

    # 2. Configure Domain Settings (Enable Manufacturing only)
    try:
        domain_settings = frappe.get_doc("Domain Settings")
        domain_settings.set("active_domains", [])
        domain_settings.append("active_domains", {"domain": "Manufacturing"})
        domain_settings.save(ignore_permissions=True)
        print("-> Domains updated: Only Manufacturing enabled.")
    except Exception as e:
        print(f"Warning: Could not update Domain Settings directly: {e}")

    # 3. Create Warehouses
    company = frappe.get_last_doc("Company")
    company_name = company.name
    company_abbr = company.abbr
    
    parent_wh_name = f"All Warehouses - {company_abbr}"
    if not frappe.db.exists("Warehouse", parent_wh_name):
        warehouses = frappe.get_all("Warehouse", filters={"is_group": 1, "company": company_name}, limit=1)
        if warehouses:
            parent_wh_name = warehouses[0].name
        else:
            print("Warning: Could not find a parent group warehouse!")
            parent_wh_name = None

    if parent_wh_name:
        for unit in ["Shakti Unit 1", "Shakti Unit 2"]:
            full_wh_name = f"{unit} - {company_abbr}"
            if not frappe.db.exists("Warehouse", full_wh_name):
                frappe.get_doc({
                    "doctype": "Warehouse",
                    "warehouse_name": unit,
                    "company": company_name,
                    "is_group": 0,
                    "parent_warehouse": parent_wh_name
                }).insert(ignore_permissions=True)
                print(f"-> Created Warehouse: {unit}")
            else:
                print(f"-> Warehouse {unit} already exists.")

    frappe.db.commit()
    print("INITIAL_CONFIG_DONE")
