import {useCurrentData} from '@/data/useDataLink';
import {useDataSource} from '@/data/dataSource';
import {DEFAULT_PREFIXES, ShaclWriter} from 'shacl-bridge';
import {useErrorService} from '@/utility/errorServiceInstance';

function triggerDownload(content: string, fileName: string, mimeType: string): void {
  const blob = new Blob([content], {type: mimeType});
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}

export async function exportShaclAsTurtle(): Promise<void> {
  try {
    const schema = useCurrentData().data.value;
    const title = useDataSource().userSchemaData.value.title ?? 'untitled';
    const turtle = await new ShaclWriter(schema)
      .getStoreBuilder()
      .withPrefixes(DEFAULT_PREFIXES)
      .write();
    triggerDownload(turtle, `${title}-shacl.ttl`, 'text/turtle');
  } catch (e: any) {
    useErrorService().onError(e);
  }
}

export async function exportShaclAsJsonLd(): Promise<void> {
  try {
    const schema = useCurrentData().data.value;
    const title = useDataSource().userSchemaData.value.title ?? 'untitled';
    const jsonLd = await new ShaclWriter(schema)
      .getStoreBuilder()
      .withPrefixes(DEFAULT_PREFIXES)
      .writeJsonLd();
    triggerDownload(jsonLd, `${title}-shacl.jsonld`, 'application/ld+json');
  } catch (e: any) {
    useErrorService().onError(e);
  }
}
