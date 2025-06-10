import { BaseExtension } from "./skeleton/BaseExtension.js";
import { viewer, data } from "../main.js";
import { toIfc } from "./js/to-ifc.js";

async function fetchIfcAlloweUsers() {
  try {
    const response = await fetch("/api/ifc/allowed_users");
    const { IFC_ALLOWED_USERS } = await response.json();
    return IFC_ALLOWED_USERS;
  } catch (error) {
    console.error("Error fetching config:", error);
    return [];
  }
}

class ifcConverterExtension extends BaseExtension {
  constructor(viewer, options) {
    super(viewer, options);
    this._button = null;
    this.IFC_ALLOWED_USERS = []; // Initialize as an empty array
  }

  async load() {
    super.load();
    console.log("IfcConverterExtension is loaded");
    this.IFC_ALLOWED_USERS = await fetchIfcAlloweUsers();
    return true;
  }

  async unload() {
    super.unload();
    if (this._button) {
      this.removeToolbarButton(this._button);
      this._button = null;
    }
    console.log("IfcConverterExtension is unloaded");
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
      "IfcConverter-button",
      "https://f3h3w7a5.rocketcdn.me/wp-content/uploads/2019/01/cropped-favicon.png",
      "Convert the rvt model to Ifc"
    );

    this._button.onClick = async () => {
      this.translateToIfc();
    };
  }

  async translateToIfc() {
    this.username = data.get("username");
    if (
      this.IFC_ALLOWED_USERS.length > 0 &&
      this.IFC_ALLOWED_USERS.includes(this.username)
    ) {
      await toIfc(data, viewer);
    } else {
      alert("Unauthorized to convert to IFC. Contact your BIM manager.");
    }
  }
}
Autodesk.Viewing.theExtensionManager.registerExtension(
  "EDD.IfcConverter",
  ifcConverterExtension
);
