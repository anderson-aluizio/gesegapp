import React, { useRef, useState, useMemo } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Button, Portal, Text } from 'react-native-paper';
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

  const dimensions = useMemo(() => {
    const { width, height } = Dimensions.get('window');
    const landscapeWidth = Math.max(width, height);
    const landscapeHeight = Math.min(width, height);
    return {
      width: landscapeWidth,
      height: landscapeHeight,
      signatureHeight: landscapeHeight - 120,
    };
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

  if (!visible) return null;

  return (
    <Portal>
      <View style={styles.overlay}>
        <View style={[styles.container, { width: dimensions.width, height: dimensions.height }]}>
          <View style={styles.header}>
            <Text variant="titleMedium" style={styles.title}>{title}</Text>
            <Text variant="bodySmall" style={styles.instruction}>
              Por favor, assine no campo abaixo:
            </Text>
          </View>
          <View style={[styles.signatureContainer, { height: dimensions.signatureHeight }]}>
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
          <View style={styles.actions}>
            <Button onPress={handleDismiss}>Cancelar</Button>
            <Button onPress={handleClear} disabled={!hasSignature}>
              Limpar
            </Button>
            <Button onPress={handleConfirm} disabled={!hasSignature} mode="contained">
              Confirmar
            </Button>
          </View>
        </View>
      </View>
    </Portal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
    transform: [{ rotate: '90deg' }],
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  title: {
    fontWeight: '600',
  },
  instruction: {
    marginTop: 4,
    color: '#666',
  },
  signatureContainer: {
    flex: 1,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    backgroundColor: '#fff',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 8,
    paddingVertical: 8,
    gap: 8,
  },
});
