<!-- Dialog to export the current JSON Schema as SHACL -->
<script setup lang="ts">
import {type Ref, ref} from 'vue';
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Select from 'primevue/select';
import {DEFAULT_PREFIXES, ShaclWriter} from 'shacl-bridge';
import {useCurrentData} from '@/data/useDataLink';
import {useDataSource} from '@/data/dataSource';
import {useErrorService} from '@/utility/errorServiceInstance';

const showDialog = ref(false);
const fileName: Ref<string> = ref('');
const format: Ref<'turtle' | 'jsonld'> = ref('turtle');
const isExporting: Ref<boolean> = ref(false);
const errorMessage: Ref<string> = ref('');

const formatOptions = [
  {label: 'Turtle (.ttl)', value: 'turtle'},
  {label: 'JSON-LD (.jsonld)', value: 'jsonld'},
];

function openDialog() {
  fileName.value = useDataSource().userSchemaData.value.title ?? 'untitled';
  format.value = 'turtle';
  errorMessage.value = '';
  showDialog.value = true;
}

function hideDialog() {
  showDialog.value = false;
  errorMessage.value = '';
  isExporting.value = false;
}

function triggerDownload(content: string, name: string, mimeType: string): void {
  const blob = new Blob([content], {type: mimeType});
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = name;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}

async function submitExport() {
  isExporting.value = true;
  errorMessage.value = '';
  try {
    const schema = useCurrentData().data.value;

    if (format.value === 'turtle') {
      const turtle = await new ShaclWriter(schema)
        .getStoreBuilder()
        .withPrefixes(DEFAULT_PREFIXES)
        .write();
      triggerDownload(turtle, `${fileName.value}.ttl`, 'text/turtle');
    } else {
      const jsonLd = await new ShaclWriter(schema)
        .getStoreBuilder()
        .withPrefixes(DEFAULT_PREFIXES)
        .writeJsonLd();
      triggerDownload(jsonLd, `${fileName.value}.jsonld`, 'application/ld+json');
    }

    hideDialog();
  } catch (e: any) {
    errorMessage.value = `Export failed: ${e?.message ?? String(e)}`;
    useErrorService().onError(e);
  } finally {
    isExporting.value = false;
  }
}

defineExpose({show: openDialog, close: hideDialog});
</script>

<template>
  <Dialog v-model:visible="showDialog" header="Export Schema as SHACL">
    <div class="shacl-export-content">
      <div class="field">
        <label for="shacl-export-format" class="field-label">Output Format</label>
        <Select
          id="shacl-export-format"
          v-model="format"
          :options="formatOptions"
          optionLabel="label"
          optionValue="value"
          class="w-full" />
      </div>

      <div class="field">
        <label for="shacl-export-filename" class="field-label">File Name</label>
        <InputText id="shacl-export-filename" v-model="fileName" class="w-full" />
        <span class="field-hint">Extension will be added automatically</span>
      </div>

      <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>

      <div class="flex justify-end mt-4 gap-2">
        <Button label="Cancel" class="p-button-text" @click="hideDialog" />
        <Button
          label="Export"
          :loading="isExporting"
          :disabled="!fileName"
          @click="submitExport"
          class="p-button-raised p-button-rounded" />
      </div>
    </div>
  </Dialog>
</template>

<style scoped>
.shacl-export-content {
  padding: 20px;
  min-width: 420px;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.field-label {
  font-weight: 600;
  font-size: 0.875rem;
}

.field-hint {
  font-size: 0.75rem;
  color: var(--p-text-muted-color, #888);
}

.error-message {
  color: red;
  white-space: pre-line;
  max-width: 600px;
}
</style>
