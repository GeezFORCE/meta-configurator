<!-- Dialog to import SHACL and convert to JSON Schema -->
<script setup lang="ts">
import {type Ref, ref} from 'vue';
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';
import {FontAwesomeIcon} from '@fortawesome/vue-fontawesome';
import {useFileDialog} from '@vueuse/core';
import {ShaclReader} from 'shacl-bridge';
import {getDataForMode} from '@/data/useDataLink';
import {SessionMode} from '@/store/sessionMode';
import {useErrorService} from '@/utility/errorServiceInstance';

const showDialog = ref(false);
const fileContent: Ref<string> = ref('');
const fileName: Ref<string> = ref('');
const errorMessage: Ref<string> = ref('');
const isConverting: Ref<boolean> = ref(false);

const {open: openFileDialog, onChange} = useFileDialog({
  accept: '.ttl,.n3,.rdf,.shacl,.jsonld',
  multiple: false,
  reset: true,
});

onChange((files: FileList | null) => {
  if (files && files.length > 0) {
    const file = files.item(0);
    if (!file) return;
    fileName.value = file.name;
    errorMessage.value = '';
    const reader = new FileReader();
    reader.onload = e => {
      fileContent.value = (e.target?.result as string) ?? '';
    };
    reader.onerror = () => {
      errorMessage.value = 'Failed to read file.';
    };
    reader.readAsText(file);
  }
});

function openDialog() {
  showDialog.value = true;
}

function hideDialog() {
  showDialog.value = false;
  fileContent.value = '';
  fileName.value = '';
  errorMessage.value = '';
}

function requestUploadFile() {
  openFileDialog();
}

async function submitImport() {
  if (!fileContent.value) return;
  isConverting.value = true;
  errorMessage.value = '';
  try {
    getDataForMode(SessionMode.SchemaEditor).setData(
      await new ShaclReader()
        .withOptions({excludeShaclExtensions: true})
        .fromContent(fileContent.value)
        .convert()
    );
    hideDialog();
  } catch (e: any) {
    errorMessage.value = `Conversion failed: ${e?.message ?? String(e)}`;
    useErrorService().onError(e);
  } finally {
    isConverting.value = false;
  }
}

defineExpose({show: openDialog, close: hideDialog});
</script>

<template>
  <Dialog v-model:visible="showDialog" header="Import SHACL as JSON Schema">
    <div class="shacl-dialog-content">
      <div class="flex align-items-center gap-3">
        <Button
          label="Select SHACL File"
          @click="requestUploadFile"
          class="p-button-raised p-button-rounded" />
        <span v-if="fileName" class="text-sm text-gray-600">{{ fileName }}</span>
        <FontAwesomeIcon
          v-if="fileContent"
          icon="fa-regular fa-circle-check"
          class="text-green-500" />
      </div>

      <p class="text-sm text-gray-500 mt-2">
        Accepted formats: Turtle (.ttl), N3 (.n3), RDF/XML (.rdf), JSON-LD (.jsonld)
      </p>

      <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>

      <div class="flex justify-end mt-4">
        <Button
          v-if="fileContent"
          label="Import"
          :loading="isConverting"
          @click="submitImport"
          class="p-button-raised p-button-rounded" />
      </div>
    </div>
  </Dialog>
</template>

<style scoped>
.shacl-dialog-content {
  padding: 20px;
  min-width: 400px;
  display: flex;
  flex-direction: column;
}

.error-message {
  color: red;
  white-space: pre-line;
  max-width: 600px;
  margin-top: 0.5rem;
}
</style>
