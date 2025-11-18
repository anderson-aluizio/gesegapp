import React, { useRef, useState } from 'react';
import { View, StyleSheet, Modal } from 'react-native';
import { Button, Portal, Dialog, Text } from 'react-native-paper';
import Signature from 'react-native-signature-canvas';

interface SignatureCaptureProps {
  visible: boolean;
  onConfirm: (signature: string) => void;
  onDismiss: () => void;
  title?: string;
}

export default function SignatureCapture({
  visible,
  onConfirm,
  onDismiss,
  title = 'Assinatura'
}: SignatureCaptureProps) {
  const signatureRef = useRef<any>(null);
  const [hasSignature, setHasSignature] = useState(false);

  const handleSignature = (signature: string) => {
    onConfirm(signature);
    setHasSignature(false);
  };

  const handleClear = () => {
    signatureRef.current?.clearSignature();
    setHasSignature(false);
  };

  const handleConfirm = () => {
    signatureRef.current?.readSignature();
  };

  const handleBegin = () => {
    setHasSignature(true);
  };

  const handleDismiss = () => {
    handleClear();
    onDismiss();
  };

  const style = `.m-signature-pad {box-shadow: none; border: none; }
              .m-signature-pad--body {border: none;}
              .m-signature-pad--footer {display: none; margin: 0px;}
              body,html {width: 100%; height: 100%;}`;

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={handleDismiss} style={styles.dialog}>
        <Dialog.Title>{title}</Dialog.Title>
        <Dialog.Content>
          <Text variant="bodySmall" style={styles.instruction}>
            Por favor, assine no campo abaixo:
          </Text>
          <View style={styles.signatureContainer}>
            <Signature
              ref={signatureRef}
              onOK={handleSignature}
              onBegin={handleBegin}
              descriptionText=""
              clearText="Limpar"
              confirmText="Confirmar"
              webStyle={style}
              autoClear={false}
              imageType="image/png"
            />
          </View>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={handleDismiss}>Cancelar</Button>
          <Button onPress={handleClear} disabled={!hasSignature}>
            Limpar
          </Button>
          <Button onPress={handleConfirm} disabled={!hasSignature}>
            Confirmar
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

const styles = StyleSheet.create({
  dialog: {
    maxHeight: '80%',
  },
  instruction: {
    marginBottom: 10,
    color: '#666',
  },
  signatureContainer: {
    height: 300,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    backgroundColor: '#fff',
  },
});
