import { Button, Dialog, IconButton, Portal, Text, TextInput } from 'react-native-paper';
import { useState } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import { resetDatabase } from '@/database/databaseSchema';
import { useAuth } from '@/contexts/AuthContext';

interface ShowDialogProps {
  desc: string;
}

const ResetDataScreen = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogDesc, setDialogDesc] = useState('');
  const [passwordDialogVisible, setPasswordDialogVisible] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const { logout } = useAuth();

  const generateCurrentPassword = (): string => {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const hour = String(now.getHours()).padStart(2, '0');
    return `${day}${month}${hour}99`;
  };

  const db = useSQLiteContext();
  const showDialog = (desc: ShowDialogProps['desc']) => {
    setDialogDesc(desc);
    setDialogVisible(true);
  };
  const hideDialog = () => {
    setDialogVisible(false);
    setIsLoading(false);
  }

  const showPasswordDialog = () => {
    setPasswordDialogVisible(true);
    setPasswordInput('');
  };

  const hidePasswordDialog = () => {
    setPasswordDialogVisible(false);
    setPasswordInput('');
  };

  const handlePasswordSubmit = () => {
    const currentValidPassword = generateCurrentPassword();
    if (passwordInput === currentValidPassword) {
      setIsAdminAuthenticated(true);
      hidePasswordDialog();
      showDialog('✅ Acesso administrativo concedido.');
    } else {
      showDialog('❌ Senha incorreta. Acesso negado.');
      hidePasswordDialog();
    }
  };

  // A subtle, non-obvious status line shown in the admin dialog. It looks like a
  // normal "Última sincronização" message to regular users but gives an admin
  // the day/month/hour clues needed to assemble the dynamic password.
  const subtleAdminHint = () => {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const hour = String(now.getHours()).padStart(2, '0');
    return `Última sincronização: ${day}/${month} às ${hour}h`;
  };

  const handleResetDatabase = async () => {
    setIsLoading(true);
    try {
      await resetDatabase(db);
      logout();
    } catch (error) {
      console.error('Erro ao resetar o banco de dados:', error);
      showDialog('Erro ao resetar o banco de dados. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <>
      {!isAdminAuthenticated ? (
        <IconButton
          icon="lock"
          size={20}
          iconColor="#fff"
          onPress={showPasswordDialog}
          disabled={isLoading}
        />
      ) : (
        <IconButton
          icon="database-refresh"
          size={20}
          iconColor="#fff"
          onPress={handleResetDatabase}
          disabled={isLoading}
        />
      )}

      <Portal>
        <Dialog visible={dialogVisible} onDismiss={hideDialog}>
          <Dialog.Title>Atenção</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              {dialogDesc}
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={hideDialog}>Fechar</Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog visible={passwordDialogVisible} onDismiss={hidePasswordDialog}>
          <Dialog.Title>Acesso Administrativo</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium" style={{ marginBottom: 16 }}>
              Digite a senha de administrador para acessar funções avançadas:
            </Text>
            <TextInput
              mode="outlined"
              label="Senha"
              value={passwordInput}
              onChangeText={setPasswordInput}
              secureTextEntry
              autoFocus
              onSubmitEditing={handlePasswordSubmit}
              keyboardType="numeric"
            />
            {/* innocuous-looking status line that hints day/month/hour to admins */}
            <Text variant="bodySmall" style={{ marginTop: 12, opacity: 0.75 }}>
              {subtleAdminHint()}
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={hidePasswordDialog}>Cancelar</Button>
            <Button onPress={handlePasswordSubmit} mode="contained">
              Confirmar
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </>
  );
}

export default ResetDataScreen;