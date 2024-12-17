from odoo import models, fields,api
from datetime import datetime
from datetime import timedelta


class PosOrderLine(models.Model):
    _inherit = 'pos.order.line'

    appoint_date = fields.Date(string='Appointment Date')
    appoint_time = fields.Char(string='Appointment Time')
    concierge_id = fields.Many2one('hr.employee', string='Concierge')
    resource_id = fields.Many2one('appointment.resource', string='Resource')
    duration = fields.Float(string='Duration (hours)')  # Add the duration field


    @api.model
    def create(self, vals):
        # Convert appointment date format if needed
        if 'appoint_date' in vals:
            appoint_date_str = vals['appoint_date']
            try:
                appoint_date = datetime.strptime(appoint_date_str, '%d/%m/%Y').strftime('%Y-%m-%d')
                vals['appoint_date'] = appoint_date
            except ValueError:
                vals['appoint_date'] = None

        # Convert concierge name to ID
        if 'concierge_id' in vals and isinstance(vals['concierge_id'], str):
            concierge = self.env['hr.employee'].search([('name', '=', vals['concierge_id'])], limit=1)
            if concierge:
                vals['concierge_id'] = concierge.id
            else:
                vals['concierge_id'] = None  # or handle the case if no match found

        # Convert resource name to ID
        if 'resource_id' in vals and isinstance(vals['resource_id'], str):
            resource = self.env['appointment.resource'].search([('name', '=', vals['resource_id'])], limit=1)
            if resource:
                vals['resource_id'] = resource.id
            else:
                vals['resource_id'] = None  # or handle the case if no match found

        if 'duration' in vals:
            try:
                vals['duration'] = float(vals['duration'])  # Ensure duration is stored as a float
            except (ValueError, TypeError):
                vals['duration'] = None




        return super(PosOrderLine, self).create(vals)



    @api.model
    def check_availability(self, selected_date, selected_time_slot_id, selected_concierge_id, selected_resource_id):
        """
        Method to check the availability of a resource for a selected date, time slot, concierge, and resource.

        :param selected_date: The selected appointment date (string format).
        :param selected_time_slot_id: The selected time slot ID.
        :param selected_concierge_id: The selected concierge ID.
        :param selected_resource_id: The selected resource ID.
        :return: Dictionary containing availability status and details.
        """

        # Define the domain based on the selected parameters
        domain = [
            ('appoint_date', '=', selected_date),
            ('appoint_time', '=', selected_time_slot_id),
            ('concierge_id', '=', selected_concierge_id),
            ('resource_id', '=', selected_resource_id),
        ]

        # Perform the search using search_read for efficiency
        existing_appointments = self.search_read(domain, fields=['id', 'appoint_date'])

        # Check if any appointments already exist for the provided parameters
        if existing_appointments:
            return {'status': 'unavailable', 'message': 'The selected slot is already booked.'}
        else:
            return {'status': 'available', 'message': 'The selected slot is available.'}




class PosOrder(models.Model):
    _inherit = 'pos.order'

    @api.model
    def get_booked_slots_for_product(self, product_id):
        """
        Search for booked slots in pos.order.lines for the given product_id.
        Returns a list of dictionaries containing appointment details.
        """
        booked_slots = []

        # Search for pos.order.lines related to the product
        order_lines = self.env['pos.order.line'].search([
            ('product_id', '=', product_id),
            ('order_id.state', '=', 'paid')  # Optional: filter by order state (paid)
        ])

        # Collect the appointment details from each line
        for line in order_lines:
            booked_slots.append({
                'appointDate': line.appoint_date,
                'appointTime': line.appoint_time,
                'conciergeName': line.concierge_id if line.concierge_id else None,
                'resourceName': line.resource_id if line.resource_id else None,
            })

        return booked_slots

    @api.model
    def create(self, vals):
        # Create the POS order
        pos_order = super(PosOrder, self).create(vals)

        # Create calendar events based on the pos.order.line details
        for line in pos_order.lines:
            if line.appoint_date and line.appoint_time:
                try:
                    # Remove 'AM' or 'PM' from the appoint_time if present
                    appoint_time = line.appoint_time.strip().upper()
                    print("aaaaa",appoint_time)

                    if "AM" in appoint_time or "PM" in appoint_time:
                        # Convert to 24-hour format using strptime and strftime
                        appoint_time_24hr = datetime.strptime(appoint_time, '%I:%M %p').strftime('%H:%M')
                    else:
                        # No AM/PM, just use the 24-hour format directly
                        appoint_time_24hr = appoint_time

                    # Combine the date and the 24-hour format time
                    appoint_datetime_str = f"{line.appoint_date} {appoint_time_24hr}"

                    # Parse the combined string into a datetime object
                    appoint_datetime = datetime.strptime(appoint_datetime_str, '%Y-%m-%d %H:%M')
                    time_difference = timedelta(hours=5, minutes=30)
                    adjusted_start_datetime = appoint_datetime - time_difference

                    # Calculate stop time using duration
                    duration_hours = line.duration or 0  # Default to 0 if duration is not set
                    duration_timedelta = timedelta(hours=duration_hours)
                    adjusted_stop_datetime = adjusted_start_datetime + duration_timedelta

                    print(line.duration)

                    # # Store the combined datetime in the new field (optional)
                    # line.appoint_datetime = appoint_datetime

                    # Create a new calendar event for this POS order line
                    self.env['calendar.event'].create({
                        'name': line.full_product_name,
                        'start': adjusted_start_datetime,
                        'stop': adjusted_stop_datetime,  # You can adjust the stop time if needed
                        'description': f"POS Order created - Time: {appoint_time_24hr}",
                        'partner_id': pos_order.partner_id.id if pos_order.partner_id else None,
                        'is_pos_order_event': True,
                    })


                except ValueError:
                   print(f"Invalid datetime format for Appointment on {line.appoint_date} {line.appoint_time}")

        if pos_order.partner_id:
            print("pos partner")
            try:
                # Define the email template content
                subject = "Appointment Scheduled Successfully"
                body_html = f"""
                        <p>Dear {pos_order.partner_id.name},</p>
                        <p>Your appointment has been successfully scheduled.</p>
                        <p><strong>Order Details:</strong></p>
                        <ul>
                            <li>Appointment Date: {line.appoint_date}</li>
                            <li>Appointment Time: {line.appoint_time}</li>
                            <li>Product: {line.full_product_name}</li>
                        </ul>
                        <p>Thank you for choosing our service!</p>
                        """

                # Send the email
                self.env['mail.mail'].create({
                    'subject': subject,
                    'body_html': body_html,
                    'email_to': pos_order.partner_id.email,
                }).send()

                print("email send")

            except Exception as e:
                print(f"Failed to send email to {pos_order.partner_id.email}. Error: {str(e)}")


        return pos_order



class CalendarEvent(models.Model):
    _inherit = 'calendar.event'

    is_pos_order_event = fields.Boolean(string="Is POS Order Event", default=False)