from qrcode.util import create_data

from odoo import models, fields,api

class AppointmentTypeInherit(models.Model):
    _inherit = 'appointment.type'



    employee_id = fields.Many2many('hr.employee', string='Employee')

    @api.model
    def has_appointments_for_product(self, product_id):

        appointments = self.search([('product_id', '=', product_id)], limit=1)
        return bool(appointments)

    @api.model
    def get_available_time_slots(self, product_id):
        # Search for appointment types using the given product_id
        print("Product", product_id)
        appointment_types = self.search([('product_id', '=', product_id)])
        print(appointment_types)

        if appointment_types:
            time_slots = []
            for appointment_type in appointment_types:
                # Extract required fields
                duration = appointment_type.appointment_duration
                create_date = appointment_type.create_date
                max_schedule_days = appointment_type.max_schedule_days

                print(f"Duration: {duration}, Create Date: {create_date}, Max Schedule Days: {max_schedule_days}")

                # Search for associated slots
                slots = self.env['appointment.slot'].search([('appointment_type_id', '=', appointment_type.id)])
                for slot in slots:
                    # Get the weekday name from selection
                    weekday_value = dict(slot._fields['weekday'].selection).get(slot.weekday)

                    # Add time slot data
                    time_slots.append({
                        'weekday': weekday_value,
                        'start_hour': slot.start_hour,
                        'end_hour': slot.end_hour,
                        'duration': duration,
                        'create_date': create_date,
                        'max_schedule_days': max_schedule_days,
                    })

                print(time_slots)
            return time_slots
        else:
            return None



    @api.model
    def get_resource(self, product_id):
        # Find the appointment types for the given product_id
        appointment_types = self.search([('product_id', '=', product_id)])
        if appointment_types:
            resources = appointment_types.mapped('resource_ids')  # Get the related resource_ids

            # Return resource data as a list of dicts
            return [{
                'id': resource.id,
                'name': resource.name
            } for resource in resources]
        return []

    @api.model
    def get_employee(self, product_id):
        # Find the appointment types for the given product_id
        appointment_types = self.search([('product_id', '=', product_id)])
        if appointment_types:
            employees = appointment_types.mapped('employee_id')  # Get the related resource_ids

            # Return resource data as a list of dicts
            return [{
                'id': employee.id,
                'name': employee.name
            } for employee in employees]
        return []

