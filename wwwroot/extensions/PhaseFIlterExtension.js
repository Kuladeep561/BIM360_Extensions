import { BaseExtension } from "./skeleton/BaseExtension.js";
import { phaseFilterPanel } from "./skeleton/PhaseFilterPanel.js";
import { viewer as importedViewer } from "../main.js";

const PHASES = {
  BESTAND: "Bestand",
  ABBRUCH: "Abbruch",
  NEUBAU: "Neubau",
  RESTLICH: "Restlich",
};
const TAB_ID_PHASE_FILTERS = "phase-filters-tab";

export class PhaseFilterExtension extends BaseExtension {
  constructor(viewer = importedViewer, options) {
    super(viewer, options);
    this._button = null;
    this._panel = null;
  }

  load() {
    super.load();
    console.log("Phase Filter extension is loaded");
    return true;
  }

  unload() {
    super.unload();
    // if the this.bestandDbids and this.abbruchDbids are empty, then this.removeToolbarButton(this._button)

    if (this._button) {
      this.removeToolbarButton(this._button);
      this._button = null;
    }
    if (
      !this.bestandDbids.length &&
      !this.abbruchDbids.length &&
      !this.neubauDbids.length
    ) {
      this.removeToolbarButton(this._button);
      console.log("No phases available, extension unloaded");
    }

    if (this._panel) {
      this._panel.setVisible(false);
      this._panel.uninitialize();
      this._panel = null;
    }
    console.log("Phase Filter extension is unloaded");
    return true;
  }

  async onModelLoaded(model) {
    await this.initializeDbIds();
  }

  async initializeDbIds() {
    this.allLeafNodes = await this.findLeafNodes(this.viewer.model);

    const dbids = this.allLeafNodes;
    const propFilter = ["Phase Created", "Phase Demolished"];

    this.bestandDbids = await this.findPropertyValuesForCondition(
      dbids,
      propFilter,
      { "Phase Created": PHASES.BESTAND, "Phase Demolished": "Keine" }
    );
    this.abbruchDbids = await this.findPropertyValuesForCondition(
      dbids,
      propFilter,
      { "Phase Created": PHASES.BESTAND, "Phase Demolished": PHASES.NEUBAU }
    );
    this.neubauDbids = await this.findPropertyValuesForCondition(
      dbids,
      propFilter,
      { "Phase Created": PHASES.NEUBAU, "Phase Demolished": "Keine" }
    );

    const allDbidsSet = new Set(this.allLeafNodes);
    const phasesDbidSet = new Set([
      ...this.bestandDbids,
      ...this.abbruchDbids,
      ...this.neubauDbids,
    ]);

    this.restOfDbids = [...allDbidsSet].filter(
      (node) => !phasesDbidSet.has(node)
    );

    this.filteredDbids = [-1, ...this.allLeafNodes];
  }

  async findPropertyValuesForCondition(selection, propFilter, propValues) {
    return new Promise((resolve, reject) => {
      this.viewer.model.getBulkProperties(
        selection,
        { propFilter },
        (elements) => {
          const satisfiedDbIds = elements
            .filter((element) => {
              const propertiesMap = new Map(
                element.properties.map((prop) => [prop.attributeName, prop])
              );
              return Object.keys(propValues).every((attributeName) => {
                const expectedValue = propValues[attributeName];
                const property = propertiesMap.get(attributeName);
                return property && property.displayValue === expectedValue;
              });
            })
            .map((element) => element.dbId);

          resolve(satisfiedDbIds);
        },
        (error) => {
          console.error("Error:", error);
          reject(error);
        }
      );
    });
  }

  async handleCheckboxChange(phase, checkbox) {
    try {
      const phaseDbids = new Set(this.getPhaseDbids(phase));

      this.filteredDbids = checkbox.checked
        ? [...new Set([...this.filteredDbids, ...phaseDbids])]
        : this.filteredDbids.filter((dbid) => !phaseDbids.has(dbid));

      await this.viewer.isolate(
        this.filteredDbids.length > 0 ? this.filteredDbids : null
      );
    } catch (error) {
      console.error(error);
    }
  }

  getPhaseDbids(phase) {
    const phaseDbidsMap = {
      [PHASES.BESTAND]: this.bestandDbids,
      [PHASES.ABBRUCH]: this.abbruchDbids,
      [PHASES.NEUBAU]: this.neubauDbids,
      [PHASES.RESTLICH]: this.restOfDbids,
    };
    return phaseDbidsMap[phase] || [];
  }

  onToolbarCreated() {
    this._panel = new phaseFilterPanel(
      this.viewer,
      "filter-panel",
      "Filters",
      {}
    );
    this._button = this.createToolbarButton(
      "PhaseFilter-button",
      "https://img.icons8.com/fluency/48/filter--v1.png",
      "Filter the phases"
    );

    this._button.onClick = async () => {
      this._panel.setVisible(!this._panel.isVisible());
      this._button.setState(
        this._panel.isVisible()
          ? Autodesk.Viewing.UI.Button.State.ACTIVE
          : Autodesk.Viewing.UI.Button.State.INACTIVE
      );

      if (this._panel.isVisible()) {
        // Check if the tab already exists, if not, add it
        if (!this._panel.hasTab(TAB_ID_PHASE_FILTERS)) {
          this._panel.addTab(TAB_ID_PHASE_FILTERS, "Phase Filters");
          this._panel.selectTab(TAB_ID_PHASE_FILTERS);
          this._panel.addLabel(
            TAB_ID_PHASE_FILTERS,
            "TOGGLE A SWITCH TO FILTER THE PHASE"
          );

          // Define the function to be called on checkbox change
          const onCheckboxChange = (phase) => async (checkboxState) => {
            try {
              await this.handleCheckboxChange(phase, {
                checked: checkboxState,
              });
            } catch (error) {
              console.error(error);
            }
          };
          // Iterate over PHASES and create a checkbox for each phase
          for (const phase in PHASES) {
            const phaseDbids = this.getPhaseDbids(PHASES[phase]);
            if (phaseDbids.length > 0) {
              this._panel.addCheckbox(
                TAB_ID_PHASE_FILTERS,
                PHASES[phase],
                true,
                onCheckboxChange(PHASES[phase])
              );
            }
          }
        }
      }
    };
  }
}

Autodesk.Viewing.theExtensionManager.registerExtension(
  "EDD.PhaseFilter",
  PhaseFilterExtension
);
    
