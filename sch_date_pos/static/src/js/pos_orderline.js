/** @odoo-module */
import { patch } from "@web/core/utils/patch";
import { ErrorPopup } from "@point_of_sale/app/errors/popups/error_popup";
import { useService } from "@web/core/utils/hooks";
import { CustomButtonPopup } from "@sch_date_pos/app/custom_popup/custom_popup";
import { Orderline,Order } from "@point_of_sale/app/store/models";


patch(Orderline.prototype, {
    setup(_defaultObj, options) {
        super.setup(...arguments);
        this.appointDate = "";
        this.appointTime = "";
        this.conciergeName = "";
        this.resourceName = "";
        this.duration = "" ;
    },

    export_as_JSON() {
        const json = super.export_as_JSON();
        return {
            ...json,
            appoint_date: this.get_appoint_date(),
            appoint_time: this.get_appoint_time(),
            concierge_id: this.get_concierge(),
            resource_id: this.get_resource(),
            duration: this.get_duration(),
        };
    },

    init_from_JSON(json) {
        super.init_from_JSON(...arguments);
        this.set_appoint_date(json.appoint_date);
        this.set_appoint_time(json.appoint_time);
         this.set_concierge(json.concierge_id);
        this.set_resource(json.resource_id);
        this.set_duration(json.duration);
    },

    getDisplayData() {
        return {
            ...super.getDisplayData(),
            appointDate: this.get_appoint_date(),
            appointTime: this.get_appoint_time(),
              conciergeName: this.get_concierge(),
            resourceName: this.get_resource(),
            duration: this.get_duration(),
        };
    },

    set_appoint_date(date) {
        this.appointDate = date || "";
    },

    get_appoint_date() {
        return this.appointDate;
    },

    set_appoint_time(time) {
        this.appointTime = time || "";
    },

    get_appoint_time() {
        return this.appointTime;
    },

    set_concierge(conciergeName) {
        this.conciergeName = conciergeName || "";
    },
    get_concierge() {
        return this.conciergeName;
    },

    set_resource(resourceName) {
        this.resourceName = resourceName || "";
    },
    get_resource() {
        return this.resourceName;
    },

    get_duration(){
    return this.duration;
    },

    set_duration(duration){
    this.duration = duration || "";
    },

});