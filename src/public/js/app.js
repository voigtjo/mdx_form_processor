let pendingFormPositionRestore = null;
const attachmentDraftStoragePrefix = "attachment-document-draft:";

const navigateToUserContext = (target) => {
  if (!(target instanceof HTMLSelectElement) || !target.matches("[data-user-switcher]")) {
    return;
  }

  const targetUser = target.value.trim();

  if (targetUser.length === 0) {
    return;
  }

  const currentUrl = new URL(window.location.href);
  currentUrl.searchParams.set("user", targetUser);
  window.location.assign(currentUrl.toString());
};

const getFormPositionAnchor = (trigger) => {
  if (!(trigger instanceof HTMLElement)) {
    return null;
  }

  const fieldAnchor = trigger.closest("[data-field-name]");

  if (fieldAnchor instanceof HTMLElement) {
    const fieldName = fieldAnchor.dataset.fieldName;

    if (fieldName) {
      return {
        selector: `[data-field-name="${fieldName}"]`,
        top: fieldAnchor.getBoundingClientRect().top,
      };
    }
  }

  const sectionAnchor = trigger.closest("[data-form-section]");

  if (sectionAnchor instanceof HTMLElement) {
    const sectionName = sectionAnchor.dataset.formSection;

    if (sectionName) {
      return {
        selector: `[data-form-section="${sectionName}"]`,
        top: sectionAnchor.getBoundingClientRect().top,
      };
    }
  }

  const formBody = document.getElementById("document-form-body-fragment");

  if (formBody instanceof HTMLElement) {
    return {
      selector: "#document-form-body-fragment",
      top: formBody.getBoundingClientRect().top,
    };
  }

  return null;
};

const syncRichTextControl = (control) => {
  if (!(control instanceof HTMLElement)) {
    return;
  }

  const editor = control.querySelector("[data-rich-text-editor]");
  const input = control.querySelector("[data-rich-text-input]");

  if (!(editor instanceof HTMLElement) || !(input instanceof HTMLTextAreaElement)) {
    return;
  }

  const normalizedText = editor.textContent?.replace(/\u00a0/g, " ").trim() ?? "";

  if (normalizedText.length === 0) {
    editor.innerHTML = "";
    input.value = "";
    return;
  }

  input.value = editor.innerHTML.trim();
};

const initializeRichTextControl = (control) => {
  if (!(control instanceof HTMLElement)) {
    return;
  }

  const editor = control.querySelector("[data-rich-text-editor]");
  const input = control.querySelector("[data-rich-text-input]");
  const toolbar = control.querySelector("[data-rich-text-control] .form-runtime-richtext-toolbar, .form-runtime-richtext-toolbar");

  if (!(editor instanceof HTMLElement) || !(input instanceof HTMLTextAreaElement)) {
    return;
  }

  if (control.dataset.richTextInitialized === "true") {
    syncRichTextControl(control);
    return;
  }

  if (!editor.innerHTML.trim() && input.value.trim()) {
    editor.innerHTML = input.value;
  }

  editor.addEventListener("input", () => {
    syncRichTextControl(control);
  });

  editor.addEventListener("blur", () => {
    syncRichTextControl(control);
  });

  if (toolbar instanceof HTMLElement) {
    toolbar.addEventListener("click", (event) => {
      const trigger = event.target instanceof Element ? event.target.closest("[data-rich-text-command]") : null;

      if (!(trigger instanceof HTMLButtonElement)) {
        return;
      }

      event.preventDefault();
      editor.focus();

      const command = trigger.dataset.richTextCommand;
      const value = trigger.dataset.richTextValue;

      if (!command) {
        return;
      }

      if (command === "formatBlock" && value) {
        document.execCommand(command, false, value);
      } else {
        document.execCommand(command, false, value ?? "");
      }

      syncRichTextControl(control);
    });
  }

  control.dataset.richTextInitialized = "true";
  syncRichTextControl(control);
};

const initializeRichTextControls = (root = document) => {
  if (!(root instanceof Document || root instanceof HTMLElement)) {
    return;
  }

  root.querySelectorAll("[data-rich-text-control]").forEach((control) => {
    initializeRichTextControl(control);
  });
};

const syncUserMultiselectControl = (control) => {
  if (!(control instanceof HTMLElement)) {
    return;
  }

  const select = control.querySelector("[data-user-multiselect-source]");
  const input = control.querySelector("[data-user-multiselect-input]");

  if (!(select instanceof HTMLSelectElement) || !(input instanceof HTMLInputElement)) {
    return;
  }

  input.value = Array.from(select.selectedOptions)
    .map((option) => option.value.trim())
    .filter((value) => value.length > 0)
    .join(",");
};

const syncGridControl = (control) => {
  if (!(control instanceof HTMLElement)) {
    return;
  }

  const input = control.querySelector("[data-grid-input]");

  if (!(input instanceof HTMLInputElement)) {
    return;
  }

  const serializedRows = Array.from(control.querySelectorAll("tbody tr"))
    .map((row) => Object.fromEntries(
      Array.from(row.querySelectorAll("[data-grid-cell]")).map((cell) => {
        const columnName = cell instanceof HTMLElement ? cell.dataset.gridColumn ?? "" : "";
        const value = cell instanceof HTMLInputElement ? cell.value.trim() : "";

        return [columnName, value];
      }).filter(([columnName]) => columnName.length > 0),
    ))
    .filter((row) => Object.values(row).some((value) => typeof value === "string" && value.length > 0));

  input.value = JSON.stringify(serializedRows);
};

const syncCheckboxGroupControl = (input) => {
  if (!(input instanceof HTMLInputElement)) {
    return;
  }

  const targetName = input.dataset.targetInput;

  if (!targetName) {
    return;
  }

  const container = input.closest(".form-runtime-choice-group");

  if (!(container instanceof HTMLElement)) {
    return;
  }

  const hiddenInput = container.querySelector(`[data-checkbox-group-input][name="${targetName}"]`);

  if (!(hiddenInput instanceof HTMLInputElement)) {
    return;
  }

  hiddenInput.value = Array.from(container.querySelectorAll("[data-checkbox-group-option]"))
    .filter((option): option is HTMLInputElement => option instanceof HTMLInputElement && option.checked)
    .map((option) => option.value.trim())
    .filter((value) => value.length > 0)
    .join(",");
};

const initializeUserMultiselectControls = (root = document) => {
  if (!(root instanceof Document || root instanceof HTMLElement)) {
    return;
  }

  root.querySelectorAll("[data-user-multiselect-control]").forEach((control) => {
    if (!(control instanceof HTMLElement)) {
      return;
    }

    const select = control.querySelector("[data-user-multiselect-source]");

    if (!(select instanceof HTMLSelectElement)) {
      return;
    }

    if (control.dataset.userMultiselectInitialized !== "true") {
      select.addEventListener("change", () => {
        syncUserMultiselectControl(control);
      });
      control.dataset.userMultiselectInitialized = "true";
    }

    syncUserMultiselectControl(control);
  });
};

const initializeGridControls = (root = document) => {
  if (!(root instanceof Document || root instanceof HTMLElement)) {
    return;
  }

  root.querySelectorAll("[data-grid-control]").forEach((control) => {
    if (!(control instanceof HTMLElement)) {
      return;
    }

    if (control.dataset.gridInitialized !== "true") {
      control.querySelectorAll("[data-grid-cell]").forEach((cell) => {
        if (cell instanceof HTMLInputElement) {
          cell.addEventListener("input", () => {
            syncGridControl(control);
          });
        }
      });

      control.dataset.gridInitialized = "true";
    }

    syncGridControl(control);
  });
};

const initializeCheckboxGroupControls = (root = document) => {
  if (!(root instanceof Document || root instanceof HTMLElement)) {
    return;
  }

  root.querySelectorAll("[data-checkbox-group-option]").forEach((option) => {
    if (!(option instanceof HTMLInputElement)) {
      return;
    }

    if (option.dataset.checkboxGroupInitialized !== "true") {
      option.addEventListener("change", () => {
        syncCheckboxGroupControl(option);
      });
      option.dataset.checkboxGroupInitialized = "true";
    }

    syncCheckboxGroupControl(option);
  });
};

const renumberWorkflowStatusRows = (editor) => {
  if (!(editor instanceof HTMLElement)) {
    return;
  }

  const rows = editor.querySelectorAll("[data-workflow-status-row]");

  rows.forEach((row, index) => {
    const input = row.querySelector("input[name^='statusValue__']");

    if (input instanceof HTMLInputElement) {
      input.name = `statusValue__${index}`;
    }
  });
};

const syncWorkflowStatusSelectOptions = (editor) => {
  if (!(editor instanceof HTMLElement)) {
    return;
  }

  const statusValues = Array.from(editor.querySelectorAll("[data-workflow-status-row] input[name^='statusValue__']"))
    .flatMap((input) => input instanceof HTMLInputElement ? [input.value.trim()] : [])
    .filter((value, index, values) => value.length > 0 && values.indexOf(value) === index);

  document.querySelectorAll("[data-workflow-action-status-select]").forEach((select) => {
    if (!(select instanceof HTMLSelectElement)) {
      return;
    }

    const selectedValue = select.value;
    const placeholderLabel = select.dataset.placeholderLabel ?? "Status";

    select.innerHTML = "";
    select.appendChild(new Option(placeholderLabel, ""));

    statusValues.forEach((status) => {
      const option = new Option(status, status, false, status === selectedValue);
      select.appendChild(option);
    });

    if (selectedValue && !statusValues.includes(selectedValue)) {
      select.value = "";
    }
  });
};

const initializeWorkflowStatusEditors = (root = document) => {
  if (!(root instanceof Document || root instanceof HTMLElement)) {
    return;
  }

  root.querySelectorAll("[data-workflow-status-editor]").forEach((editor) => {
    if (!(editor instanceof HTMLElement) || editor.dataset.workflowStatusInitialized === "true") {
      return;
    }

    const list = editor.querySelector("[data-workflow-status-list]");
    const template = editor.querySelector("[data-workflow-status-template]");
    const addButton = editor.querySelector("[data-workflow-status-add]");

    if (!(list instanceof HTMLElement) || !(template instanceof HTMLTemplateElement) || !(addButton instanceof HTMLButtonElement)) {
      return;
    }

    addButton.addEventListener("click", () => {
      const fragment = template.content.cloneNode(true);
      list.appendChild(fragment);
      renumberWorkflowStatusRows(editor);
      syncWorkflowStatusSelectOptions(editor);
    });

    editor.addEventListener("click", (event) => {
      const target = event.target instanceof Element ? event.target.closest("[data-workflow-status-remove], [data-workflow-status-move]") : null;

      if (!(target instanceof HTMLElement)) {
        return;
      }

      const row = target.closest("[data-workflow-status-row]");

      if (!(row instanceof HTMLElement)) {
        return;
      }

        if (target.hasAttribute("data-workflow-status-remove")) {
          if (list.querySelectorAll("[data-workflow-status-row]").length > 1) {
            row.remove();
            renumberWorkflowStatusRows(editor);
          } else {
          const input = row.querySelector("input[name^='statusValue__']");

            if (input instanceof HTMLInputElement) {
              input.value = "";
            }
          }

          syncWorkflowStatusSelectOptions(editor);

          return;
        }

      const direction = target.dataset.workflowStatusMove;

      if (direction === "up") {
        const previous = row.previousElementSibling;

        if (previous) {
          list.insertBefore(row, previous);
          renumberWorkflowStatusRows(editor);
          syncWorkflowStatusSelectOptions(editor);
        }
      }

      if (direction === "down") {
        const next = row.nextElementSibling;

        if (next) {
          list.insertBefore(next, row);
          renumberWorkflowStatusRows(editor);
          syncWorkflowStatusSelectOptions(editor);
        }
      }
    });

    editor.addEventListener("input", (event) => {
      if (event.target instanceof HTMLInputElement && event.target.name.startsWith("statusValue__")) {
        syncWorkflowStatusSelectOptions(editor);
      }
    });

    renumberWorkflowStatusRows(editor);
    syncWorkflowStatusSelectOptions(editor);
    editor.dataset.workflowStatusInitialized = "true";
  });
};

const getAttachmentDraftStorageKey = (documentId) => {
  const normalizedDocumentId = typeof documentId === "string" ? documentId.trim() : "";

  if (normalizedDocumentId.length === 0) {
    return null;
  }

  return `${attachmentDraftStoragePrefix}${normalizedDocumentId}`;
};

const buildSerializableFormState = (form) => {
  if (!(form instanceof HTMLFormElement)) {
    return null;
  }

  const values = {};

  Array.from(form.elements).forEach((element) => {
    if (
      !(element instanceof HTMLInputElement || element instanceof HTMLSelectElement || element instanceof HTMLTextAreaElement) ||
      !element.name ||
      element.disabled
    ) {
      return;
    }

    if (element instanceof HTMLInputElement) {
      if (["file", "submit", "button", "image", "reset"].includes(element.type)) {
        return;
      }

      if (element.type === "radio") {
        if (element.checked) {
          values[element.name] = element.value;
        } else if (!(element.name in values)) {
          values[element.name] = "";
        }

        return;
      }

      if (element.type === "checkbox") {
        const existingValues = Array.isArray(values[element.name]) ? values[element.name] : [];

        if (element.checked) {
          values[element.name] = [...existingValues, element.value];
        } else if (!(element.name in values)) {
          values[element.name] = [];
        }

        return;
      }
    }

    if (element instanceof HTMLSelectElement && element.multiple) {
      values[element.name] = Array.from(element.selectedOptions).map((option) => option.value);
      return;
    }

    values[element.name] = element.value;
  });

  return values;
};

const syncDocumentFormControls = (form) => {
  if (!(form instanceof HTMLFormElement)) {
    return;
  }

  form.querySelectorAll("[data-rich-text-control]").forEach((control) => {
    syncRichTextControl(control);
  });

  form.querySelectorAll("[data-user-multiselect-control]").forEach((control) => {
    syncUserMultiselectControl(control);
  });

  form.querySelectorAll("[data-grid-control]").forEach((control) => {
    syncGridControl(control);
  });

  form.querySelectorAll("[data-checkbox-group-option]").forEach((option) => {
    syncCheckboxGroupControl(option);
  });
};

const persistDocumentDraftBeforeAttachmentUpload = (uploadForm) => {
  if (!(uploadForm instanceof HTMLFormElement)) {
    return;
  }

  const documentId = uploadForm.dataset.documentId;
  const storageKey = getAttachmentDraftStorageKey(documentId);
  const documentForm = document.querySelector('[data-document-form="true"]');

  if (!storageKey || !(documentForm instanceof HTMLFormElement)) {
    return;
  }

  syncDocumentFormControls(documentForm);

  const serializedState = buildSerializableFormState(documentForm);

  if (!serializedState) {
    return;
  }

  window.sessionStorage.setItem(storageKey, JSON.stringify(serializedState));
};

const restoreRichTextControls = (form) => {
  form.querySelectorAll("[data-rich-text-control]").forEach((control) => {
    if (!(control instanceof HTMLElement)) {
      return;
    }

    const editor = control.querySelector("[data-rich-text-editor]");
    const input = control.querySelector("[data-rich-text-input]");

    if (editor instanceof HTMLElement && input instanceof HTMLTextAreaElement) {
      editor.innerHTML = input.value.trim() ? input.value : "";
    }
  });
};

const restoreUserMultiselectControls = (form) => {
  form.querySelectorAll("[data-user-multiselect-control]").forEach((control) => {
    if (!(control instanceof HTMLElement)) {
      return;
    }

    const input = control.querySelector("[data-user-multiselect-input]");
    const select = control.querySelector("[data-user-multiselect-source]");

    if (!(input instanceof HTMLInputElement) || !(select instanceof HTMLSelectElement)) {
      return;
    }

    const selectedValues = input.value
      .split(",")
      .map((value) => value.trim())
      .filter((value) => value.length > 0);

    Array.from(select.options).forEach((option) => {
      option.selected = selectedValues.includes(option.value);
    });
  });
};

const restoreCheckboxGroupControls = (form) => {
  form.querySelectorAll("[data-checkbox-group-input]").forEach((input) => {
    if (!(input instanceof HTMLInputElement)) {
      return;
    }

    const selectedValues = input.value
      .split(",")
      .map((value) => value.trim())
      .filter((value) => value.length > 0);
    const container = input.closest(".form-runtime-choice-group");

    if (!(container instanceof HTMLElement)) {
      return;
    }

    container.querySelectorAll("[data-checkbox-group-option]").forEach((option) => {
      if (option instanceof HTMLInputElement) {
        option.checked = selectedValues.includes(option.value);
      }
    });
  });
};

const restoreGridControls = (form) => {
  form.querySelectorAll("[data-grid-control]").forEach((control) => {
    if (!(control instanceof HTMLElement)) {
      return;
    }

    const input = control.querySelector("[data-grid-input]");

    if (!(input instanceof HTMLInputElement)) {
      return;
    }

    let parsedRows = [];

    if (input.value.trim().length > 0) {
      try {
        const candidate = JSON.parse(input.value);
        parsedRows = Array.isArray(candidate) ? candidate : [];
      } catch (_error) {
        parsedRows = [];
      }
    }

    const rows = Array.from(control.querySelectorAll("tbody tr"));

    rows.forEach((row, rowIndex) => {
      const rowValue = parsedRows[rowIndex] && typeof parsedRows[rowIndex] === "object" ? parsedRows[rowIndex] : {};

      row.querySelectorAll("[data-grid-cell]").forEach((cell) => {
        if (!(cell instanceof HTMLInputElement) || !(cell.dataset.gridColumn)) {
          return;
        }

        const nextValue = rowValue[cell.dataset.gridColumn];
        cell.value = typeof nextValue === "string" ? nextValue : "";
      });
    });
  });
};

const restoreDocumentDraftAfterAttachmentUpload = () => {
  const documentForm = document.querySelector('[data-document-form="true"]');

  if (!(documentForm instanceof HTMLFormElement)) {
    return;
  }

  const documentId = documentForm.dataset.documentId;
  const storageKey = getAttachmentDraftStorageKey(documentId);

  if (!storageKey) {
    return;
  }

  const storedState = window.sessionStorage.getItem(storageKey);

  if (!storedState) {
    return;
  }

  let values = null;

  try {
    const parsedValues = JSON.parse(storedState);
    values = parsedValues && typeof parsedValues === "object" ? parsedValues : null;
  } catch (_error) {
    values = null;
  }

  if (!values) {
    window.sessionStorage.removeItem(storageKey);
    return;
  }

  Object.entries(values).forEach(([name, rawValue]) => {
    const controls = documentForm.querySelectorAll(`[name="${CSS.escape(name)}"]`);

    if (controls.length === 0) {
      return;
    }

    controls.forEach((control) => {
      if (!(control instanceof HTMLInputElement || control instanceof HTMLSelectElement || control instanceof HTMLTextAreaElement)) {
        return;
      }

      if (control instanceof HTMLInputElement && control.type === "radio") {
        control.checked = typeof rawValue === "string" && control.value === rawValue;
        return;
      }

      if (control instanceof HTMLInputElement && control.type === "checkbox") {
        const selectedValues = Array.isArray(rawValue) ? rawValue.filter((value) => typeof value === "string") : [];
        control.checked = selectedValues.includes(control.value);
        return;
      }

      if (control instanceof HTMLSelectElement && control.multiple) {
        const selectedValues = Array.isArray(rawValue) ? rawValue.filter((value) => typeof value === "string") : [];
        Array.from(control.options).forEach((option) => {
          option.selected = selectedValues.includes(option.value);
        });
        return;
      }

      control.value = typeof rawValue === "string" ? rawValue : "";
    });
  });

  restoreRichTextControls(documentForm);
  restoreUserMultiselectControls(documentForm);
  restoreCheckboxGroupControls(documentForm);
  restoreGridControls(documentForm);
  syncDocumentFormControls(documentForm);

  window.sessionStorage.removeItem(storageKey);
};

const initializeCodeEditors = (root = document) => {
  if (typeof window.initializeCodeEditors === "function") {
    window.initializeCodeEditors(root);
  }
};

document.addEventListener("change", (event) => {
  navigateToUserContext(event.target);
});

document.addEventListener("input", (event) => {
  navigateToUserContext(event.target);
});

const closeDialogButton = document.querySelector("[data-dialog-close]");
const appDialog = document.querySelector("[data-app-dialog]");

const clearDialogQueryParams = () => {
  if (!(appDialog instanceof HTMLElement)) {
    return;
  }

  const currentUrl = new URL(window.location.href);
  currentUrl.searchParams.delete("dialogType");
  currentUrl.searchParams.delete("dialogTitle");
  currentUrl.searchParams.delete("dialogMessage");
  window.history.replaceState({}, "", currentUrl.toString());
  appDialog.remove();
};

if (closeDialogButton instanceof HTMLButtonElement) {
  closeDialogButton.addEventListener("click", clearDialogQueryParams);
}

if (appDialog instanceof HTMLElement) {
  appDialog.addEventListener("click", (event) => {
    if (event.target === appDialog) {
      clearDialogQueryParams();
    }
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      clearDialogQueryParams();
    }
  });
}

document.addEventListener("click", (event) => {
  const preserveTrigger = event.target instanceof Element ? event.target.closest("[data-preserve-form-position]") : null;

  if (preserveTrigger instanceof HTMLElement) {
    pendingFormPositionRestore = getFormPositionAnchor(preserveTrigger);
  }

  const genericOpenTrigger = event.target instanceof Element ? event.target.closest("[data-modal-open]") : null;

  if (genericOpenTrigger instanceof HTMLElement) {
    const dialogId = genericOpenTrigger.dataset.modalOpen;
    const dialog = dialogId ? document.getElementById(dialogId) : null;

    if (dialog instanceof HTMLDialogElement) {
      dialog.showModal();
    }

    return;
  }

  const genericCloseTrigger = event.target instanceof Element ? event.target.closest("[data-modal-close]") : null;

  if (genericCloseTrigger instanceof HTMLElement) {
    const dialog = genericCloseTrigger.closest("dialog");

    if (dialog instanceof HTMLDialogElement) {
      dialog.close();
    }

    return;
  }

  const openTrigger = event.target instanceof Element ? event.target.closest("[data-journal-dialog-open]") : null;

  if (openTrigger instanceof HTMLElement) {
    const dialogId = openTrigger.dataset.journalDialogOpen;
    const dialog = dialogId ? document.getElementById(dialogId) : null;

    if (dialog instanceof HTMLDialogElement) {
      dialog.showModal();
    }

    return;
  }

  const closeTrigger = event.target instanceof Element ? event.target.closest("[data-journal-dialog-close]") : null;

  if (closeTrigger instanceof HTMLElement) {
    const dialog = closeTrigger.closest("dialog");

    if (dialog instanceof HTMLDialogElement) {
      dialog.close();
    }

    return;
  }

  if (event.target instanceof HTMLDialogElement && event.target.classList.contains("journal-entry-dialog")) {
    event.target.close();
  }

  if (event.target instanceof HTMLDialogElement && event.target.classList.contains("workflow-json-dialog")) {
    event.target.close();
  }
});

document.addEventListener("submit", (event) => {
  const form = event.target;

  if (!(form instanceof HTMLFormElement)) {
    return;
  }

  syncDocumentFormControls(form);

  if (form.matches("[data-preserve-document-draft='true']")) {
    persistDocumentDraftBeforeAttachmentUpload(form);
  }
}, true);

document.addEventListener("htmx:afterSwap", (event) => {
  const target = event.target;

  if (target instanceof HTMLElement) {
    initializeCodeEditors(target);
    initializeRichTextControls(target);
    initializeUserMultiselectControls(target);
    initializeGridControls(target);
    initializeCheckboxGroupControls(target);
    initializeWorkflowStatusEditors(target);
  }

  if (
    pendingFormPositionRestore &&
    target instanceof HTMLElement &&
    (target.id === "document-form-body-fragment" || target.id === "document-workspace-fragment")
  ) {
    const anchor = document.querySelector(pendingFormPositionRestore.selector);

    if (anchor instanceof HTMLElement) {
      const delta = anchor.getBoundingClientRect().top - pendingFormPositionRestore.top;

      if (Math.abs(delta) > 1) {
        window.scrollBy({ top: delta, left: 0, behavior: "auto" });
      }
    }

    pendingFormPositionRestore = null;
  }
});

initializeCodeEditors(document);
initializeRichTextControls(document);
initializeUserMultiselectControls(document);
initializeGridControls(document);
initializeCheckboxGroupControls(document);
initializeWorkflowStatusEditors(document);
restoreDocumentDraftAfterAttachmentUpload();
