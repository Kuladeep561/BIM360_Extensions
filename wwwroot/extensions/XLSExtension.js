import { BaseExtension } from "./skeleton/BaseExtension.js";
import { APSXLS } from "./js/apsXLS.js";
import { data } from "../main.js";

function statusCallback(completed, message) {
  // Using Toastify to display a notification
  Toastify({
    text: message,
    duration: 1000,
    close: true,
    gravity: "bottom",
    position: "right",
    style: {
      background: completed
        ? "linear-gradient(to right, #00b09b, #96c93d)"
        : "#ff6347",
    },
  }).showToast();
}

class XLSExtension extends BaseExtension {
  constructor(viewer, options) {
    super(viewer, options);
    this._button = null;
  }

  load() {
    super.load();
    console.log("XLSExtension is loaded");
    return true;
  }

  unload() {
    super.unload();
    if (this._button) {
      this.removeToolbarButton(this._button);
      this._button = null;
    }
    console.log("XLSExtension is unloaded");
    return true;
  }
  onModelLoaded(model) {
    super.onModelLoaded(model);
  }

  onSelectionChanged(model, dbids) {
    super.onSelectionChanged(model, dbids);
  }

  onIsolationChanged(model, dbids) {
    super.onIsolationChanged(model, dbids);
  }
  onToolbarCreated() {
    this._button = this.createToolbarButton(
      "xlsExtension-button",
      "https://img.icons8.com/color/48/microsoft-excel-2019--v1.png",
      "Export to .XLSX"
    );
    this._button.onClick = async () => {
      // Define fileName here or retrieve it from the appropriate source
      const fileName = data.get("filename");

      // Modify this part according to your logic for exporting to XLSX
      APSXLS.downloadXLSX(
        fileName.replace(/\./g, "") + ".xlsx",
        statusCallback
      ); /*Optional*/
    };
  }
}

Autodesk.Viewing.theExtensionManager.registerExtension(
  "EDD.XLSExtension",
  XLSExtension
);
