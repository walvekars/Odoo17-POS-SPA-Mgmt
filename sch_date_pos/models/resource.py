from odoo import models, fields,api

class ResourcesInherit(models.Model):
    _inherit = 'appointment.resource'


    @api.model
    def get_resource_data(self, args=None, kwargs=None):
        # Define search domain and fields to read
        domain = []  # Example: [('name', 'ilike', 'Sunshine')]
        fields_to_read = ['id', 'name']

        # Call search_read method
        resource_data = self.search_read(domain, fields_to_read)
        return resource_data