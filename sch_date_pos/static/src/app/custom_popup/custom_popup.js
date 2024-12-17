/** @odoo-module */
import { AbstractAwaitablePopup } from "@point_of_sale/app/popup/abstract_awaitable_popup";
import { _t } from "@web/core/l10n/translation";
import { usePos } from "@point_of_sale/app/store/pos_hook";
import { onMounted, useRef, useState,useEffect} from "@odoo/owl";
/**
* This class represents a custom popup in the Point of Sale.
* It extends the AbstractAwaitablePopup class.
*/
export class CustomButtonPopup extends AbstractAwaitablePopup {
   static template = "nhcl_pos_sale.CustomButtonPopup";
    static defaultProps = {
        confirmText: _t("Confirm"),
          cancelText: _t("Cancel"),
        title: "",
        body: "",
        conciergeOptions: [],  // Set default empty array
        resourceOptions: [],
        timeSlots: [],
         appointDate: "",       // Add default value for appointDate
    appointTime: "",
    };



    setup() {
        super.setup();
        this.state = useState({
            inputDate: this.props.appointDate || "",
            inputTime: this.props.appointTime || "",
            month: new Date().getMonth(),
            year: new Date().getFullYear(),
            selectedDate: null,
            conciergeOptions: [],  // Initialize empty array for concierge options
            conciergeOptions: this.props.conciergeOptions || [],  // Default to props or empty array
            resourceOptions: this.props.resourceOptions || [],
            timeSlots: [], // Initialize empty array for time slots
            selectedTimeSlot: null,
             selectedConciergeId: null,
                selectedResourceId: null,
                 selectedConciergeId: null,
                selectedResourceId: null,
                bookedSlots: this.props.bookedSlots || [],
                dates:[],
                selectedWeekday : null,
                slotDuration : null,

        });

        console.log("SLOTS",this.state.bookedSlots);
        this.selectDate = this.selectDate.bind(this);
        this.dateRef = useRef("inputDate");
        this.timeRef = useRef("inputTime");

        onMounted(this.onMounted);

        // Load available time slots (you may pass productId as prop or initialize it elsewhere)
        const productId = this.props.productId ; // Example productId
//        this.loadAvailableTimeSlots(productId);

        // Bind selectTimeSlot method
        this.selectTimeSlot = this.selectTimeSlot.bind(this);
//        this.loadAvailableTimeSlots = this.loadAvailableTimeSlots.bind(this);
         this.onConciergeChange = this.onConciergeChange.bind(this);
    this.onResourceChange = this.onResourceChange.bind(this);


     this.loadConciergeOptions();
    this.loadResourceOptions();

       this.handleKeydown = this.handleKeydown.bind(this);


        document.addEventListener("keydown", this.handleKeydown);


    }

    onMounted() {
         if (!this.props.appointDate) {
            console.warn("Appoint Date is not provided");
        }

        if (this.dateRef.el) {
            this.dateRef.el.focus();
        }
          this.getDatesArray();
       }


    onCancel(){
       this.props.resolve({ confirmed: false, payload: false });
        this.props.close();

      }

      handleKeydown(event) {
    if (event.key === "Escape") {
        this.onCancel();
    }
}

onWillUnmount() {
    super.onWillUnmount();
    // Clean up the keydown event listener
    document.removeEventListener("keydown", this.handleKeydown);
}


   async loadAvailableTimeSlots() {
    try {
        console.log("Searching for available time slots... Product ID:", this.props.productId);
        const rpc = this.env.services.rpc; // Access `rpc` through `this.env.services.rpc`

        const result = await rpc("/web/dataset/call_kw/product.template/get_available_time_slots", {
            model: 'appointment.type',
            method: 'get_available_time_slots',
            args: [this.props.productId],
            kwargs: {}
        });

        console.log("Result from RPC Call:", result);


        if (result && Array.isArray(result)) {
            console.log("Result from RPC Call:", result);

            const slotDuration = result[0]?.duration; // Safely access the `duration` field
    if (slotDuration) {
        this.state.slotDuration = slotDuration; // Store the duration in the state
        console.log("Slot Duration Stored in State:", this.state.slotDuration);
    } else {
        console.warn("No duration found in the first time slot.");
    }

            // Split the slots based on duration and weekday
            const slotsByWeekday = {
                Monday: [],
                Tuesday: [],
                Wednesday: [],
                Thursday: [],
                Friday: [],
                Saturday: [],
                Sunday: [],
            };


           const bookedSlots = this.state.bookedSlots || [];


          result.forEach(slot => {
    // Convert start and end times to total minutes
    let currentMinutes = Math.floor(slot.start_hour) * 60 + Math.round((slot.start_hour % 1) * 60); // Convert 8.3 to 8:18 (498 minutes)
    const endMinutes = Math.floor(slot.end_hour) * 60 + Math.round((slot.end_hour % 1) * 60); // Convert 20 to 1200 minutes
    const duration = Math.round(slot.duration * 60); // Convert duration to minutes

    console.log(`Processing slot: Weekday - ${slot.weekday}, Start - ${slot.start_hour}, End - ${slot.end_hour}, Duration - ${slot.duration} hours`);

    // Generate individual slots based on duration
    while (currentMinutes + duration <= endMinutes) {
        const formattedTime = this.formatTimeFromMinutes(currentMinutes); // Format time
        slotsByWeekday[slot.weekday].push({ hour: formattedTime });

        // Increment by duration
        currentMinutes += duration;
    }
});

            console.log("Slots Grouped by Weekday:", slotsByWeekday);



            // Extract the weekdays from available time slots
           const availableWeekdays = Object.keys(slotsByWeekday).filter(day => slotsByWeekday[day].length > 0);

            // Store the time slots and available weekdays in state
            this.state.timeSlots = slotsByWeekday;
            this.state.availableWeekdays = availableWeekdays;

            // If you want to render specific slots for the selected weekday, filter here:
            const selectedWeekday = this.state.selectedWeekday; // Use the selected weekday from state
            const availableSlotsForSelectedDay = this.state.timeSlots[selectedWeekday] || [];

            console.log(`Available Slots for ${selectedWeekday}:`, availableSlotsForSelectedDay);



            console.log("boo",this.state.timeSlots);



            // Update the state with the slots for the selected day
            this.state.selectedDaySlots = availableSlotsForSelectedDay;




            // Now render only the slots for the selected weekday
            this.render();
        } else {
            console.log("No time slots found or invalid structure.");
        }
    } catch (error) {
        console.error("Error loading time slots:", error);
    }
}

formatHour12(hour) {
    const isPM = hour >= 12;
    const adjustedHour = hour % 12 || 12; // Convert 0 and 12 to 12
    const period = isPM ? "PM" : "AM";
    return `${adjustedHour}:00 ${period}`;
}

formatTimeFromMinutes(totalMinutes) {
    const hour = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const isPM = hour >= 12;
    const adjustedHour = hour % 12 || 12; // Convert 0 and 12 to 12
    const formattedMinutes = minutes.toString().padStart(2, '0'); // Ensure two digits for minutes
    const period = isPM ? "PM" : "AM";
    return `${adjustedHour}:${formattedMinutes} ${period}`;
}


formatTime(hour, minutes) {
    const isPM = hour >= 12;
    const adjustedHour = hour % 12 || 12; // Convert 0 and 12 to 12
    const period = isPM ? "PM" : "AM";
    const formattedMinutes = minutes.toString().padStart(2, '0'); // Ensure two digits for minutes
    return `${adjustedHour}:${formattedMinutes} ${period}`;
}


selectTimeSlot(slot, buttonId) {
    console.log("Button ID:", buttonId);
    console.log("SLOTSSSS",slot);


     try {
        // Reset all button styles
        const allSlots = document.querySelectorAll('button[id^="slot_button_"]');
        allSlots.forEach(button => {
            if (button) {
                button.style.backgroundColor = 'black';
                button.style.color = '#42c1a8';
            }
        });

        // Highlight the selected button
        const selectedButton = document.getElementById(buttonId);
        if (selectedButton) {
            selectedButton.style.backgroundColor = '#e74c3c';
            selectedButton.style.color = 'white';
        } else {
            console.error("Button not found:", buttonId);
        }

        this.state.selectedTimeSlot = slot;

    } catch (error) {
        console.error("Error in selectTimeSlot:", error);
    }
}


getPayload() {
    const selectedDate = this.state.selectedDate;
    let formattedDate = "";

    if (selectedDate) {
        // Format the date as 'day/month/year'
        const day = String(selectedDate.getDate()).padStart(2, '0'); // Add leading zero for single-digit days
        const month = String(selectedDate.getMonth() + 1).padStart(2, '0'); // Add leading zero for single-digit months
        const year = selectedDate.getFullYear();

        formattedDate = `${day}/${month}/${year}`;
    }

    const selectedTimeSlot = this.state.selectedTimeSlot?.hour; // Safely access the hour
    const formattedTime = selectedTimeSlot || ""; // Use the selected time directly without formatting

    console.log("Formatted time in getPayload:", formattedTime);
    console.log("Formatted Date in getPayload:", formattedDate);
    console.log("Resource", this.state.selectedResourceName);

    return {
        appointDate: formattedDate || null,
        appointTime: formattedTime || null,
        conciergeId: this.state.selectedConciergeId || null,
        conciergeName: this.state.selectedConciergeName || null,
        resourceId: this.state.selectedResourceId || null,
        resourceName: this.state.selectedResourceName || null,
        duration: this.state.slotDuration || null,
    };
}


    async loadConciergeOptions() {
    try {
        // Fetch concierge data using correct rpc service access
        const rpc = this.env.services.rpc;
        const result = await rpc("/web/dataset/call_kw/appointment.type",{
            model: 'appointment.type',
            method: 'get_employee',
            args: [this.props.productId],
             kwargs: {}
        });

        // Update the state with the loaded options
        this.state.conciergeOptions = result || [];
        console.log("Loaded concierge options:", this.state.conciergeOptions);
    } catch (error) {
        console.error('Error loading concierge options:', error);
    }
}

// Method to load resource options
async loadResourceOptions() {
    try {
        // Fetch resource data using correct rpc service access
         const rpc = this.env.services.rpc;
        const result = await rpc("/web/dataset/call_kw/appointment.type",{
            model: 'appointment.type',
            method: 'get_resource',
            args: [this.props.productId],
             kwargs: {}
        });

        // Update the state with the loaded options
        this.state.resourceOptions = result || [];
        console.log("Loaded resource options:", this.state.resourceOptions);
    } catch (error) {
        console.error('Error loading resource options:', error);
    }
}

   onConciergeChange(event) {
        const selectedConciergeName = event.target.value;
        const selectedConcierge = this.state.conciergeOptions.find(concierge => concierge.name === selectedConciergeName);

        this.state.selectedConciergeId = selectedConcierge.id;
        this.state.selectedConciergeName = selectedConcierge.name || "";


        console.log("Selected Concierge:", this.state.selectedConciergeId);
    }



    onResourceChange(event) {
    const selectedResourceName = event.target.value;

    // Check that resourceOptions is an array
    if (Array.isArray(this.state.resourceOptions)) {
        const selectedResource = this.state.resourceOptions.find(resource => resource.name === selectedResourceName);

        if (selectedResource) {
            this.state.selectedResourceId = selectedResource.id || null;
            this.state.selectedResourceName = selectedResource.name || "";
            console.log("Selected Resource:", this.state.selectedResourceId);
        }
    }
}



     getMonthName(monthIndex) {
       const monthNames = [
           "January", "February", "March", "April", "May", "June",
           "July", "August", "September", "October", "November", "December"
       ];
       return monthNames[monthIndex];
   }

  changeMonthBefore() {
    if (this.state.month === 0) {
        this.state.year -= 1;
        this.state.month = 11;
    } else {
        this.state.month -= 1;
    }
    this.getDatesArray(); // Recalculate dates for the new month
    this.render(); // Re-render the UI if necessary
}

changeMonthAfter() {
    if (this.state.month === 11) {
        this.state.month = 0;
        this.state.year += 1;
    } else {
        this.state.month += 1;
    }
    this.getDatesArray(); // Recalculate dates for the new month
    this.render(); // Re-render the UI if necessary
}

async getDatesArray() {
    try {
        // Ensure year and month are correctly set in state
        const { year, month } = this.state;

        // Get the number of days in the month
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        // Get the first day of the month (0=Sunday, 6=Saturday)
        const firstDay = new Date(year, month, 1).getDay();
        console.log(`Year: ${year}, Month: ${month}, First Day: ${firstDay}`);

        const datesArray = [];

        // Add empty elements for padding before the first day of the month
        for (let i = 0; i < firstDay; i++) {
            datesArray.push({ date: '', selectable: false });
        }

        // Add days of the current month with default `selectable` property
        for (let day = 1; day <= daysInMonth; day++) {
            datesArray.push({ date: day, selectable: false });
        }

        // Process dates to determine which are selectable
        const processedDates = await this.processDates(datesArray);
        console.log("Processed Dates:", processedDates);

        // Update the state with the processed dates
        this.state.dates = processedDates;
    } catch (error) {
        console.error("Error fetching or processing dates:", error);
        this.state.dates = []; // Default to an empty array in case of an error
    }
}



async processDates(datesArray) {
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const rpc = this.env.services.rpc;

    try {
        // Fetch available time slots and scheduling constraints from the backend
        const timeSlots = await rpc("/web/dataset/call_kw/product.template/get_available_time_slots", {
            model: 'appointment.type',
            method: 'get_available_time_slots',
            args: [this.props.productId],
            kwargs: {}
        });

        // Extract `max_schedule_days` from the first result (assuming one product/appointment type)
        if (!timeSlots || !timeSlots.length) {
            console.warn("No available time slots returned");
            return datesArray.map(entry => ({ ...entry, selectable: false })); // Mark all dates as non-selectable
        }

        const { max_schedule_days } = timeSlots[0];
        const availableWeekdays = [...new Set(timeSlots.map(slot => slot.weekday))];

        // Use the current date as the starting point
        const currentDate = new Date(); // Get the current date
        const startDate = currentDate;
        const endDate = new Date(currentDate);
        endDate.setDate(currentDate.getDate() + max_schedule_days); // Add max_schedule_days to the current date

        console.log(`Max Schedule Days: ${max_schedule_days}`);
        console.log(`Valid Date Range: ${startDate} to ${endDate}`);
        console.log(`Available Weekdays: ${availableWeekdays}`);

        // Update each date with a `selectable` property based on range and weekday availability
        return datesArray.map((entry) => {
            if (entry.date === '') return entry; // Skip padding dates

            // Construct the current date for this entry
            const entryDate = new Date(this.state.year, this.state.month, entry.date);

            // Check if the entry date is within the valid range and matches an available weekday
            const dayOfWeek = daysOfWeek[entryDate.getDay()];
            const isWithinRange = entryDate >= startDate && entryDate <= endDate;
            const isAvailableWeekday = availableWeekdays.includes(dayOfWeek);

            entry.selectable = isWithinRange && isAvailableWeekday;
            return entry;
        });
    } catch (error) {
        console.error("Error fetching available time slots:", error);
        return datesArray.map(entry => ({ ...entry, selectable: false })); // Mark all dates as non-selectable in case of an error
    }
}





selectDate(date, event) {
    // Clear previous selections by resetting background color of all dates
    const allDates = document.querySelectorAll('.date-select');
    allDates.forEach(div => {
        div.style.backgroundColor = 'black';
    });

    // Highlight the selected date
    const selectedDiv = event.currentTarget;
    selectedDiv.style.backgroundColor = '#e74c3c';

    // Set the selected date in the state
    this.state.selectedDate = new Date(this.state.year, this.state.month, date);
     const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const selectedWeekday = weekdays[this.state.selectedDate.getDay()]; // Get the weekday name

    // Set the selected weekday
    this.state.selectedWeekday = selectedWeekday;


      this.loadAvailableTimeSlots();  // Pass selected date



    console.log("Selected Date:", this.state.selectedDate);
}


extractIdFromString(str) {
    const match = str.match(/\((\d+),?\)/);  // Match digits within parentheses
    return match ? parseInt(match[1], 10) : null;
}

// Helper function to get concierge by ID
getConciergeById(id) {
    if (id !== null) {
        // Assuming this.state.conciergeOptions is an array of concierge objects
        return this.state.conciergeOptions.find(concierge => concierge.id === id);
    }
    return null;
}

// Helper function to get resource by ID
getResourceById(id) {
    if (id !== null) {
        // Assuming this.state.resourceOptions is an array of resource objects
        return this.state.resourceOptions.find(resource => resource.id === id);
    }
    return null;
}








}








