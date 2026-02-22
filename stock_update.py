import frappe

def on_submit(doc, method):
    try:
        company = "Shakti Enterprises"
        company_abbr = frappe.db.get_value("Company", company, "abbr")
        warehouse = f"Shakti {doc.unit} - {company_abbr}"
        
        # Create a Manufacture Stock Entry
        stock_entry = frappe.new_doc("Stock Entry")
        stock_entry.purpose = "Manufacture"
        stock_entry.company = company
        
        # Decrease Raw Material
        if doc.raw_material and doc.quantity_consumed:
            stock_entry.append("items", {
                "item_code": doc.raw_material,
                "qty": doc.quantity_consumed,
                "s_warehouse": warehouse,
                "t_warehouse": "",
                "is_finished_item": 0,
                "use_serial_batch_fields": 0
            })
            
        # Increase Finished Goods
        if doc.product and doc.pieces_produced:
            stock_entry.append("items", {
                "item_code": doc.product,
                "qty": doc.pieces_produced,
                "s_warehouse": "",
                "t_warehouse": warehouse,
                "is_finished_item": 1,
                "use_serial_batch_fields": 0
            })
            
        stock_entry.set_stock_entry_type()
        stock_entry.insert(ignore_permissions=True)
        stock_entry.submit()
        
        frappe.msgprint(f"Stock Entry {stock_entry.name} created based on Shift Production.")
    except Exception as e:
        frappe.throw(f"Failed to update stock: {str(e)}")
