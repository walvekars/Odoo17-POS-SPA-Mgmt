from odoo import models, fields,api

class EmployeeInherit(models.Model):
    _inherit = 'hr.employee'

    @api.model
    def get_employee_data(self, args=None, kwargs=None):
        # Define search domain and fields to read
        domain = []
        fields_to_read = ['id', 'name']

        # Call search_read method
        employee_data = self.search_read(domain, fields_to_read)
        print(employee_data)
        return employee_data