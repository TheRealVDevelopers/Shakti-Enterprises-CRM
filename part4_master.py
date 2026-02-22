import frappe

def execute():
    try:
        frappe.flags.ignore_permissions = True
        company = "Shakti Enterprises"

        # 1. Create Extra Item Groups
        for group in ["Raw Material", "Finished Goods", "Moulds"]:
            if not frappe.db.exists("Item Group", group):
                frappe.get_doc({
                    "doctype": "Item Group",
                    "item_group_name": group,
                    "parent_item_group": "All Item Groups"
                }).insert(ignore_permissions=True)

        # 2. Suppliers
        suppliers = ["Supreme Plastics", "Global Polymers"]
        for supplier in suppliers:
            if not frappe.db.exists("Supplier", supplier):
                frappe.get_doc({
                    "doctype": "Supplier",
                    "supplier_name": supplier,
                    "supplier_group": "Local"
                }).insert(ignore_permissions=True)

        # 3. Customers
        customers = ["Mega Auto Parts", "National Motors"]
        for customer in customers:
            if not frappe.db.exists("Customer", customer):
                frappe.get_doc({
                    "doctype": "Customer",
                    "customer_name": customer,
                    "customer_group": "Commercial",
                    "territory": "India"
                }).insert(ignore_permissions=True)

        # 4. Workstations
        for i in range(1, 9):
            unit = "Unit 1" if i <= 4 else "Unit 2"
            w_name = f"Machine {i} {unit}"
            if not frappe.db.exists("Workstation", w_name):
                # Working hours are configured in the Workstation child table, but for quick insertion:
                frappe.get_doc({
                    "doctype": "Workstation",
                    "workstation_name": w_name,
                    "hour_rate": 500
                }).insert(ignore_permissions=True)

        # 5. Raw Materials
        if not frappe.db.exists("Item", "RM-001"):
            doc = frappe.get_doc({
                "doctype": "Item",
                "item_code": "RM-001",
                "item_name": "Plastic Granules",
                "item_group": "Raw Material",
                "stock_uom": "Kg",
                "is_stock_item": 1,
                "is_purchase_item": 1,
                "is_sales_item": 0
            })
            doc.append("reorder_levels", {
                "warehouse": "Shakti Unit 1 - SE",
                "warehouse_reorder_level": 500,
                "warehouse_reorder_qty": 2000,
                "material_request_type": "Purchase"
            })
            doc.append("item_defaults", {
                "company": company,
                "default_supplier": "Supreme Plastics",
                "default_warehouse": "Shakti Unit 1 - SE"
            })
            doc.insert(ignore_permissions=True)

        # 6. Finished Goods
        if not frappe.db.exists("Item", "FG-001"):
            doc = frappe.get_doc({
                "doctype": "Item",
                "item_code": "FG-001",
                "item_name": "Baffle",
                "item_group": "Finished Goods",
                "stock_uom": "Nos",
                "is_stock_item": 1,
                "is_purchase_item": 0,
                "is_sales_item": 1
            })
            doc.append("item_defaults", {
                "company": company,
                "default_warehouse": "Shakti Unit 1 - SE"
            })
            doc.insert(ignore_permissions=True)

        if not frappe.db.exists("Item", "FG-002"):
            doc = frappe.get_doc({
                "doctype": "Item",
                "item_code": "FG-002",
                "item_name": "Shim",
                "item_group": "Finished Goods",
                "stock_uom": "Nos",
                "is_stock_item": 1,
                "is_purchase_item": 0,
                "is_sales_item": 1
            })
            doc.append("item_defaults", {
                "company": company,
                "default_warehouse": "Shakti Unit 2 - SE"
            })
            doc.insert(ignore_permissions=True)

        # 7. Moulds
        if not frappe.db.exists("Item", "MLD-001"):
            doc = frappe.get_doc({
                "doctype": "Item",
                "item_code": "MLD-001",
                "item_name": "Baffle Mould Core",
                "item_group": "Moulds",
                "stock_uom": "Nos",
                "is_stock_item": 0,
                "is_purchase_item": 0,
                "is_sales_item": 0
            })
            doc.insert(ignore_permissions=True)

        # 8. User Roles Profile (Creating mock user accounts for Supervisor/Owner)
        users = [
            {"email": "owner1@erpnext.local", "first_name": "Shakti", "last_name": "Owner 1", "roles": ["System Manager", "Manufacturing Master Manager", "BOM Manager", "Sales Master Manager", "Purchase Master Manager", "Accounts Manager"]},
            {"email": "owner2@erpnext.local", "first_name": "Shakti", "last_name": "Owner 2", "roles": ["System Manager", "Manufacturing Master Manager", "BOM Manager", "Sales Master Manager", "Purchase Master Manager", "Accounts Manager"]},
            {"email": "supervisor@erpnext.local", "first_name": "Shop", "last_name": "Supervisor", "roles": ["Manufacturing User", "Stock User"]},
            {"email": "admin2@erpnext.local", "first_name": "Office", "last_name": "Admin", "roles": ["Accounts User", "Sales User", "Purchase User", "HR User"]}
        ]

        for u in users:
            if not frappe.db.exists("User", u["email"]):
                user_doc = frappe.get_doc({
                    "doctype": "User",
                    "email": u["email"],
                    "first_name": u["first_name"],
                    "last_name": u["last_name"],
                    "send_welcome_email": 0
                }).insert(ignore_permissions=True)
                for role in u["roles"]:
                    if frappe.db.exists("Role", role):
                        user_doc.append("roles", {"role": role})
                user_doc.save(ignore_permissions=True)

        frappe.db.commit()
        print("MASTER_DATA_SETUP_SUCCESSFUL")
    except Exception as e:
        frappe.db.rollback()
        import traceback
        traceback.print_exc()
        print(f"Error: {e}")
