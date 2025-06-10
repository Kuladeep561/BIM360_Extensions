const HEIGHT_ADJUSTMENT = 50 /*title-bar*/ + 40 /*tab-bar*/ + 20; /*footer*/

export class phaseFilterPanel extends Autodesk.Viewing.UI.SettingsPanel {
  constructor(viewer, id, title, options) {
    super(viewer.container, id, title, { heightAdjustment: HEIGHT_ADJUSTMENT });
    this.setGlobalManager(viewer.globalManager);
    this.container.classList.add("viewer-settings-panel");
    this.viewer = viewer;
  }
}
