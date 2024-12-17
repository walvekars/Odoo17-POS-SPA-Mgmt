{
    'name': 'POS-Spa Management',
    'Version': '17.0.1.1.0.1',
    'category': 'Extra Tools',
    'depends': ['point_of_sale','web','hr','appointment'],
    'data': [

        'views/pos_order_line.xml',
        'views/appointment_view.xml',
        'views/appointment_portal.xml',
    ],
    'assets': {
        'point_of_sale._assets_pos': [
            'sch_date_pos/static/src/**/*',

            ],
    },
    'author':'ODOO',
    'licence':'LGPL-3',
    'installable': True,
    'auto_install': False,
    'application': False,
}
