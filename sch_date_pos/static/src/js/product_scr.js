/** @odoo-module */
import { CustomButtonPopup } from "@sch_date_pos/app/custom_popup/custom_popup";
import { ErrorPopup } from "@point_of_sale/app/errors/popups/error_popup";
import { ProductScreen } from "@point_of_sale/app/screens/product_screen/product_screen";
import { patch } from "@web/core/utils/patch";
import { ErrorBarcodePopup } from "@point_of_sale/app/barcode/error_popup/barcode_error_popup";
import { useService } from "@web/core/utils/hooks";
import { PosStore } from "@point_of_sale/app/store/pos_store";

import { NumberPopup } from "@point_of_sale/app/utils/input_popups/number_popup";
import { _t } from "@web/core/l10n/translation";
import { usePos } from "@point_of_sale/app/store/pos_hook";
import { ConfirmPopup } from "@point_of_sale/app/utils/confirm_popup/confirm_popup";



patch(PosStore.prototype, {




    async addProductToCurrentOrder(product, options = {}) {

         const productId = product.id;
         console.log("ProductID",productId);
        if (Number.isInteger(product)) {
            product = this.db.get_product_by_id(product);
        }
        this.get_order() || this.add_new_order();

        options = { ...options, ...(await product.getAddProductOptions()) };

        if (!Object.keys(options).length) {
            return;
        }

        // Add the product after having the extra information.
        await this.addProductFromUi(product, options);
        this.customer(product);

        this.numberBuffer.reset();
    },


    
   async customer(product) {

     const rpc = this.env.services.rpc; // Access `rpc` through `this.env.services.rpc`

     const hasAppointments = await rpc("/web/dataset/call_kw/appointment.type/has_appointments_for_product", {
            model: 'appointment.type',
            method: 'has_appointments_for_product',
            args: [product.id], // Pass the product ID
            kwargs: {},
        });

    if (!hasAppointments) {
        console.log("No appointments available for this product.");
        return;
    }

    console.log("Appointments available for product:", product.id);


    // Get the selected order line (the current product line being added)
    const selectedOrderline = this.get_order().get_selected_orderline();
    if (!selectedOrderline) return;

//           const rpc = this.env.services.rpc; // Access `rpc` through `this.env.services.rpc`
    const bookedSlots = await rpc("/web/dataset/call_kw/pos.order",{
            model: 'pos.order',
            method: 'get_booked_slots_for_product',
            args: [product.id],
            kwargs : {}
        });

        // Log the booked slots
        console.log("Booked slots for product", product.id, bookedSlots);
        if (Array.isArray(bookedSlots)) {
    bookedSlots.forEach(slot => {
        console.log("Appoint Time:", slot.appointTime);
    });
} else {
    console.error("Booked slots is not an array:", bookedSlots);
}

    // Show the CustomButtonPopup to collect appointment details
    const { confirmed, payload } = await this.popup.add(CustomButtonPopup, {
        appointDate: "",
        appointTime: "",
        title: _t("Schedule Appointment"),
        productId: product.id, // Pass the productId to the popup
         bookedSlots: bookedSlots,


    });

    console.log("Payload appointDate:", payload.appointDate);  // Debugging line
    console.log("Payload detai",payload.conciergeId,payload.resourceId);

    // If confirmed, set the appointment date and time on the selected order line
    if (confirmed) {
        selectedOrderline.set_appoint_date(payload.appointDate);
        selectedOrderline.set_appoint_time(payload.appointTime);
        selectedOrderline.set_concierge(payload.conciergeName);
        selectedOrderline.set_resource(payload.resourceName);
        selectedOrderline.set_duration(payload.duration);

    } else {
    console.log("close");
    selectedOrderline.set_appoint_date();
    selectedOrderline.set_appoint_time();
    selectedOrderline.set_concierge();
    selectedOrderline.set_resource();
    selectedOrderline.set_duration();
}






    return true;
}

});


