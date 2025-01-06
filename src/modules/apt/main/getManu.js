"use strict";
const utility = require("src/lib/global/utility");

module.exports = async (req, res) => {
  const children = [];
  const ruoli = req.locals.infoApp.ruoli;

  children.push({
    iconCls: "icon-folder_apartment",
    itemId: "apartments",
    text: req.i18n.__("apt.grids.apartments.title"),
    leaf: true,
  });

  children.push({
    iconCls: "icon-folder_lead",
    itemId: "leads",
    text: req.i18n.__("apt.grids.leads.title"),
    leaf: true,
  });

  children.push({
    iconCls: "icon-folder_promotion",
    itemId: "promotions",
    text: req.i18n.__("apt.grids.promotions.title"),
    leaf: true,
  });

  children.push({
    iconCls: "icon-folder_service",
    itemId: "services",
    text: req.i18n.__("apt.grids.services.title"),
    leaf: true,
  });

//   if (utility.checkRuoli(ruoli, ["99"])) {
//     children.push({
//       iconCls: "icon-folder_lightbulb",
//       itemId: "parametri",
//       text: req.i18n.__("apt.forms.parametri.title"),
//       leaf: true,
//     });
//   }

  res.status(200).json({ children: children });
};
