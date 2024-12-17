/** @odoo-module */
import { Orderline } from "@point_of_sale/app/generic_components/orderline/orderline";
import { patch } from "@web/core/utils/patch";
import { DateTimeInput } from '@web/core/datetime/datetime_input';


patch(Orderline.prototype, {
    static: {
        props: {
            ...Orderline.props,
            line: {
                ...Orderline.props.line,
                shape: {
                    ...Orderline.props.line.shape,
                   appointDate: { type: String, optional: true },
                    appointTime: { type: String, optional: true },
                    conciergeName: { type: String, optional: true },
                    resourceName: { type: String, optional: true },
                    duration: { type:String,optional:true},


                }
            }
        }
    }
});