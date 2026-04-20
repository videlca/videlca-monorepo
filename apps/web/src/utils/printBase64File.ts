export const printBase64PDF = (base64: string) => {
  if (typeof window === 'undefined') return;

  const byteCharacters = atob(base64);
  const byteArray = new Uint8Array(byteCharacters.length);

  for (let i = 0; i < byteCharacters.length; i++) {
    byteArray[i] = byteCharacters.charCodeAt(i);
  }

  const blob = new Blob([byteArray], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);

  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.src = url;

  document.body.appendChild(iframe);

  iframe.onload = () => {
    if(!iframe.contentWindow) {
      console.error('Error al imprimir');
      return;
    }
    iframe.contentWindow.focus();
    iframe.contentWindow.print();

  };
};