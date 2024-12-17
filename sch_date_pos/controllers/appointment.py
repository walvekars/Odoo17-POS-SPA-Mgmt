from datetime import datetime
from operator import itemgetter

from odoo import http, _
from odoo.http import request
from odoo.osv.expression import AND, OR
from odoo.tools import groupby as groupbyelem

from odoo.addons.portal.controllers import portal
from odoo.addons.portal.controllers.portal import pager as portal_pager
from odoo.addons.appointment.controllers.portal import AppointmentPortal  # Updated import path

class CustomAppointmentPortal(AppointmentPortal):


    def _get_portal_default_domain(self):
        my_user = request.env.user
        print(my_user)
        event = request.env['calendar.event'].search(
            [('is_pos_order_event', '=', True),('user_id','=',my_user.id)])  # Only events with True is_pos_order_event
        print("evvv",event.user_id)
        print(event.user_id == my_user)
        # Print events to debug
        for ev in event:
            print(ev.name,ev.user_id.name)
            print(ev.user_id)
        print("user", my_user.id)


        return [
            '|',  # OR condition between the two groups
            '&',  # AND for the first group
            ('is_pos_order_event', '=', True),  # Condition 1 (AND)
            ('user_id', '=', my_user.id),  # Condition 2 (AND)
            '&',  # AND for the second group
            ('user_id', '!=', my_user.id),  # Condition 3 (AND)
            ('partner_ids', 'in', my_user.partner_id.ids),  # Condition 4 (AND)
        ]



    @http.route(['/my/appointments', '/my/appointments/page/<int:page>'], type='http', auth='user', website=True)
    def portal_my_appointments(self, page=1, sortby=None, filterby=None, search=None, search_in='all', groupby='none',
                               **kwargs):
        # Prepare the portal layout values
        values = self._prepare_portal_layout_values()
        Event = request.env['calendar.event'].sudo()

        # Get the base domain from the inherited function
        domain = self._get_portal_default_domain()
        print(domain)

        # Searchbar configurations
        searchbar_sortings = {
            'date': {'label': _('Date'), 'order': 'start'},
            'name': {'label': _('Name'), 'order': 'name'},
        }
        searchbar_filters = {
            'upcoming': {'label': _("Upcoming"), 'domain': [('start', '>=', datetime.today())]},
            'past': {'label': _("Past"), 'domain': [('start', '<', datetime.today())]},
            'all': {'label': _("All"), 'domain': []},
        }

        # Set default sort and filter
        if not sortby:
            sortby = 'date'
        sort_order = searchbar_sortings[sortby]['order']

        if not filterby:
            filterby = 'all'
        domain = AND([domain, searchbar_filters[filterby]['domain']])

        # Add search functionality
        if search and search_in:
            domain = AND([domain, self._get_appointment_search_domain(search_in, search)])

        # Fetch appointment records
        appointment_count = Event.search_count(domain)
        pager = portal_pager(
            url="/my/appointments",
            url_args={'sortby': sortby, 'search_in': search_in, 'search': search, 'groupby': groupby},
            total=appointment_count,
            page=page,
            step=self._items_per_page,
        )
        appointments = Event.search(domain, order=sort_order, limit=self._items_per_page, offset=pager['offset'])
        for a in appointments:
            print("APPP",a.name)

        # Group appointments (if required)
        grouped_appointments = False
        if groupby != 'none':
            grouped_appointments = [(g, Event.concat(*events)) for g, events in
                                    groupbyelem(appointments, itemgetter(groupby))]

        # Update the values dictionary
        values.update({
            'appointments': appointments,
            'grouped_appointments': grouped_appointments,
            'page_name': 'appointment',
            'pager': pager,
            'default_url': '/my/appointments',
            'searchbar_sortings': searchbar_sortings,
            'search_in': search_in,
            'search': search,
            'sortby': sortby,
            'filterby': filterby,
            'searchbar_filters': searchbar_filters,
        })

        if 'appointments' in values:
            print("===== Appointments in Values =====")
            for appointment in values['appointments']:
                print(f"Name: {appointment.name}, Start Date: {appointment.start}, User: {appointment.user_id.name}")
            print("===================================")

        # Render the portal page
        return request.render("appointment.portal_my_appointments", values)
