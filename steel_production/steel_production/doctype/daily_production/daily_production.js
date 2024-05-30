frappe.ui.form.on('Daily Production', {
    refresh(frm) {
        calculate_time_difference(frm);
    }, mill_on_time: function (frm) {
        calculate_time_difference(frm);
    }, mill_off_time: function (frm) {
        calculate_time_difference(frm);
    }
});

frappe.ui.form.on('Raw Material Items', {
    qty: function (frm, cdt, cdn) {
        calculate_waste_weight(frm, cdt, cdn);
        raw_material_items_totals(frm);
    },
    wastage_percentage: function (frm, cdt, cdn) {
        calculate_waste_weight(frm, cdt, cdn);
        raw_material_items_totals(frm);
    },
    rate: function (frm, cdt, cdn) {
        calculate_waste_weight(frm, cdt, cdn);
        raw_material_items_totals(frm);
    }
});
frappe.ui.form.on("Finish Items", {
    qty: function (frm, cdt, cdn) {
        calculate_net_qty(frm, cdt, cdn);
        finish_items_totals(frm);
    },
    ovals: function (frm, cdt, cdn) {
        calculate_net_qty(frm, cdt, cdn);
        finish_items_totals(frm);
    },
    end_cutts: function (frm, cdt, cdn) {
        calculate_net_qty(frm, cdt, cdn);
        finish_items_totals(frm);
    }
});
frappe.ui.form.on('Gas Meter Reading', {
    previous_reading: function (frm, cdt, cdn) {
        calculate_consumed_units(frm, cdt, cdn);
    },
    current_reading: function (frm, cdt, cdn) {
        calculate_consumed_units(frm, cdt, cdn);
    }
});
frappe.ui.form.on('Furnace Fuel Consumption And Stock', {
    on_time: function (frm, cdt, cdn) {
        calculate_fuel_consumption(frm, cdt, cdn);
    },
    off_time: function (frm, cdt, cdn) {
        calculate_fuel_consumption(frm, cdt, cdn);
    },
    previous_gauge_measure: function (frm, cdt, cdn) {
        calculate_fuel_consumption(frm, cdt, cdn);
    },
    current_gauge_measure: function (frm, cdt, cdn) {
        calculate_fuel_consumption(frm, cdt, cdn);
    },
    previous_stock: function (frm, cdt, cdn) {
        calculate_fuel_consumption(frm, cdt, cdn);
    },
    current_stock: function (frm, cdt, cdn) {
        calculate_fuel_consumption(frm, cdt, cdn);
    }
});

function calculate_time_difference(frm) {
    if (frm.doc.mill_on_time && frm.doc.mill_off_time) {
        const millOnTime = moment(frm.doc.mill_on_time, "HH:mm:ss A");
        const millOffTime = moment(frm.doc.mill_off_time, "HH:mm:ss A");

        // Calculate the difference in hours
        const duration = moment.duration(millOffTime.diff(millOnTime));
        const hours = duration.asHours();

        // You can update a field with the calculated hours or display it
        frm.set_value('net_hours', hours);

        // Refresh the field to show the updated value
        frm.refresh_field('net_hours');
    }
}

function raw_material_items_totals(frm) {
    var raw_material_items = frm.doc.raw_material_items;
    frm.doc.total_raw_material_qty = 0;
    frm.doc.total_raw_material_wastage_weight = 0;
    frm.doc.total_raw_material_net_weight = 0;
    frm.doc.total_raw_material_amount = 0;

    for (var i in raw_material_items) {
        frm.doc.total_raw_material_qty += raw_material_items[i].qty || 0;
        frm.doc.total_raw_material_wastage_weight += raw_material_items[i].wastage_weight || 0;
        frm.doc.total_raw_material_net_weight += raw_material_items[i].net_weight || 0;
        frm.doc.total_raw_material_amount += raw_material_items[i].amount || 0;
    }

    frm.refresh_field("total_raw_material_qty");
    frm.refresh_field("total_raw_material_wastage_weight");
    frm.refresh_field("total_raw_material_net_weight");
    frm.refresh_field("total_raw_material_amount");
}

function calculate_waste_weight(frm, cdt, cdn) {
    var d = locals[cdt][cdn];
    var wastage_weight = flt(d.qty) * (flt(d.wastage_percentage || 0) / 100);
    var net_weight = flt(d.qty) - wastage_weight;
    frappe.model.set_value(d.doctype, d.name, "amount", (net_weight || 0) * flt(d.rate));
    frappe.model.set_value(d.doctype, d.name, "wastage_weight", wastage_weight);
    frappe.model.set_value(d.doctype, d.name, "net_weight", net_weight);
}

function finish_items_totals(frm) {
    var finish_items = frm.doc.finish_items;
    frm.doc.total_finish_qty = 0;
    frm.doc.total_finish_ovals = 0;
    frm.doc.total_finish_end_cutts = 0;
    frm.doc.total_finish_net_qty = 0;

    for (var i in finish_items) {
        frm.doc.total_finish_qty += finish_items[i].qty || 0;
        frm.doc.total_finish_ovals += finish_items[i].ovals || 0;
        frm.doc.total_finish_end_cutts += finish_items[i].end_cutts || 0;
        frm.doc.total_finish_net_qty += finish_items[i].net_qty || 0;
    }

    frm.refresh_field("total_finish_qty");
    frm.refresh_field("total_finish_ovals");
    frm.refresh_field("total_finish_end_cutts");
    frm.refresh_field("total_finish_net_qty");
}

function calculate_net_qty(frm, cdt, cdn) {
    var d = locals[cdt][cdn];
    var net_qty = flt(d.qty) - (flt(d.ovals || 0) + flt(d.end_cutts || 0));
    frappe.model.set_value(d.doctype, d.name, "net_qty", net_qty || 0);
}

function calculate_consumed_units(frm, cdt, cdn) {
    var d = locals[cdt][cdn];
    var consumed_units = flt(d.current_reading || 0) - (flt(d.previous_reading) || 0);
    frappe.model.set_value(d.doctype, d.name, "consumed_units", consumed_units || 0);
}

function calculate_fuel_consumption(frm, cdt, cdn) {
    var d = locals[cdt][cdn];
    if (d.on_time && d.off_time) {
        const OnTime = moment(d.on_time, "HH:mm:ss A");
        const OffTime = moment(d.off_time, "HH:mm:ss A");
        const duration = moment.duration(OffTime.diff(OnTime));
        const hours = duration.asHours();
        frappe.model.set_value(d.doctype, d.name, 'net_run_time', hours);
    }
    var fuel_consumption = flt(d.previous_gauge_measure || 0) - flt(d.current_gauge_measure || 0);
    frappe.model.set_value(d.doctype, d.name, "fuel_consumption", fuel_consumption || 0);
    var production = flt(d.current_stock || 0) - flt(d.previous_stock || 0);
    frappe.model.set_value(d.doctype, d.name, "production", production || 0);
}