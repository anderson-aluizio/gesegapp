import React, { useRef, useState, useMemo } from 'react';
import { View, StyleSheet, Dimensions, ScrollView } from 'react-native';
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

  // Calculate responsive signature height based on screen size
  const signatureHeight = useMemo(() => {
    const screenHeight = Dimensions.get('window').height;
    // Use 35% of screen height, with min 200 and max 350
    const calculatedHeight = screenHeight * 0.35;
    return Math.max(200, Math.min(350, calculatedHeight));
  }, []);

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
        <Dialog.Content style={styles.dialogContent}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text variant="bodySmall" style={styles.instruction}>
              Por favor, assine no campo abaixo:
            </Text>
            <View style={[styles.signatureContainer, { height: signatureHeight }]}>
              <Signature
                ref={signatureRef}
                onOK={handleSignature}
                onBegin={handleBegin}
                descriptionText="Assine aqui"
                clearText="Limpar"
                confirmText="Confirmar"
                webStyle={style}
                autoClear={false}
                imageType="image/png"
              />
            </View>
          </ScrollView>
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
    maxHeight: '85%',
  },
  dialogContent: {
    paddingHorizontal: 0,
    paddingTop: 10,
  },
  instruction: {
    marginBottom: 10,
    marginHorizontal: 24,
    color: '#666',
  },
  signatureContainer: {
    marginHorizontal: 24,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    backgroundColor: '#fff',
  },
});
