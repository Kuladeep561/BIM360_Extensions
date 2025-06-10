async function getJSON(url) {
    const resp = await fetch(url);
    if (!resp.ok) {
        alert('Could not load tree data. See console for more details.');
        console.error(await resp.text());
        return [];
    }
    return resp.json();
}

function createTreeNode(id, text, icon, children = false, derivativesId = null) {
    return { id, text, children, itree: { icon },derivativesId} ;
}

async function getHubs() {
    const hubs = await getJSON('/api/hubs');
    return hubs.map(hub => createTreeNode(`hub|${hub.id}`, hub.attributes.name, 'icon-hub', true));
}

async function getProjects(hubId) {
    const projects = await getJSON(`/api/hubs/${hubId}/projects`);
    return projects.map(project => createTreeNode(`project|${hubId}|${project.id}`, project.attributes.name, 'icon-project', true));
}

async function getContents(hubId, projectId, folderId = null) {
    const contents = await getJSON(`/api/hubs/${hubId}/projects/${projectId}/contents` + (folderId ? `?folder_id=${folderId}` : ''));
    return contents.map(item => {
        if (item.type === 'folders') {
            return createTreeNode(`folder|${hubId}|${projectId}|${item.id}`, item.attributes.displayName, 'icon-my-folder', true);
        } else {
            return createTreeNode(`item|${hubId}|${projectId}|${item.id}`, item.attributes.displayName, 'icon-item', true);
        }
    });
}

async function getVersions(hubId, projectId, itemId) {
  const versions = await getJSON(
    `/api/hubs/${hubId}/projects/${projectId}/contents/${itemId}/versions`
  );
  return versions.map((version) => {
    const { id, attributes, relationships } = version;
    const filename = attributes.name;
    const versionTag = `V${attributes.versionNumber} | ${attributes.createTime}`;
    const derivativesId = relationships?.derivatives?.data?.id || null; // Extract 'id' from 'derivatives' object

    return createTreeNode(
      `version|${id}|${filename}|${derivativesId}`,
      versionTag,
      "icon-version",
      false
    );
  });
}

export function initTree(selector, onSelectionChanged) {
  // See http://inspire-tree.com
  const tree = new InspireTree({
    data: function (node) {
      if (!node || !node.id) {
        // Check if node states are stored in localStorage
        const storedNodeStates = localStorage.getItem("treeNodeStates");

        const nodeStates = storedNodeStates ? JSON.parse(storedNodeStates) : {};

        // If the main node state is not present, provide a default state
        const mainNodeState = nodeStates["hub|main"] || { collapsed: false };

        return mainNodeState.collapsed ? [] : getHubs();
      } else {
        const tokens = node.id.split("|");

        switch (tokens[0]) {
          case "hub":
            return getProjects(tokens[1]);
          case "project":
            return getContents(tokens[1], tokens[2]);
          case "folder":
            return getContents(tokens[1], tokens[2], tokens[3]);
          case "item":
            return getVersions(tokens[1], tokens[2], tokens[3]);
          default:
            return [];
        }
      }
    },
  });
  tree.on("node.click", function (event, node) {
    event.preventTreeDefault();
    const tokens = node.id.split("|");
    if (tokens[0] === "version") {
      onSelectionChanged(tokens[1], tokens[2], tokens[3]);
    }
  });

  tree.on("node.collapsed", saveNodeStates);
  tree.on("node.expanded", saveNodeStates);

  function saveNodeStates() {
    const nodeStates = {};
    tree.nodes().forEach((node) => {
      node.recurseDown((childNode) => {
        nodeStates[childNode.id] = {
          collapsed: childNode.collapsed(),
        };
      });
    });

    localStorage.setItem("treeNodeStates", JSON.stringify(nodeStates));
  }

  
  return new InspireTreeDOM(tree, { target: selector });
}