import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Drawer } from 'expo-router/drawer';
import { Alert, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function DrawerLayout() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const colorScheme = useColorScheme();
  const textColor = useThemeColor({}, 'text');
  const backgroundColor = useThemeColor({}, 'background');

  const roleName = user?.rol?.nombre?.trim().toLowerCase();
  const isAdmin = user?.id_rol === 1 || roleName === 'administrador';

  const handleLogout = () => {
    Alert.alert(
      'Cerrar sesión',
      '¿Estás seguro de que deseas cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar sesión',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
            } catch (error) {
              Alert.alert('Error', 'No se pudo cerrar sesión');
            }
          },
        },
      ]
    );
  };

  return (
    <Drawer
      screenOptions={{
        headerShown: true,
        drawerActiveTintColor: '#007AFF',
        drawerInactiveTintColor: textColor,
        drawerStyle: {
          backgroundColor: backgroundColor,
        },
        headerStyle: {
          backgroundColor: backgroundColor,
        },
        headerTintColor: textColor,
      }}
      drawerContent={(props) => {
        const hiddenRoutes = new Set([
          'cerrar-sesion',
          'productos/nuevo',
          'productos/editar',
          'ventas/nuevo',
          'ventas/editar',
          'ventas/detalle',
        ]);

        const allowedRoutes = isAdmin
          ? new Set(['home', 'ventas', 'reportes', 'configuracion', 'productos'])
          : new Set(['home', 'ventas']);

        const routes = props.state.routes.filter(
          (route) => !hiddenRoutes.has(route.name) && allowedRoutes.has(route.name)
        );

        const focusedRouteKey = props.state.routes[props.state.index]?.key;
        
        return (
          <SafeAreaView style={[styles.drawerContent, { backgroundColor }]} edges={['bottom']}>
            <View style={styles.drawerHeader}>
              <ThemedText type="title" style={styles.drawerTitle}>
                Control de Agua
              </ThemedText>
              {user && (
                <ThemedText style={styles.drawerSubtitle}>
                  {user.correo}
                </ThemedText>
              )}
            </View>

            <View style={styles.drawerItems}>
              {routes.map((route, index) => {
                const isFocused = route.key === focusedRouteKey;
                const iconName = getIconName(route.name);
                const label = getLabel(route.name);

                return (
                  <TouchableOpacity
                    key={route.key}
                    style={[
                      styles.drawerItem,
                      isFocused && styles.drawerItemActive,
                    ]}
                    onPress={() => props.navigation.navigate(route.name)}>
                    <Ionicons
                      name={iconName}
                      size={24}
                      color={isFocused ? '#007AFF' : textColor}
                    />
                    <ThemedText
                      style={[
                        styles.drawerItemText,
                        isFocused && { color: '#007AFF' },
                      ]}>
                      {label}
                    </ThemedText>
                  </TouchableOpacity>
                );
              })}
              
              {/* Botón Cerrar sesión después de Configuración */}
              <TouchableOpacity
                style={[
                  styles.drawerItem,
                  { borderTopColor: textColor + '20', borderTopWidth: 1, marginTop: 8 },
                ]}
                onPress={handleLogout}>
                <Ionicons name="log-out-outline" size={24} color="#FF3B30" />
                <ThemedText style={[styles.drawerItemText, { color: '#FF3B30' }]}>
                  Cerrar sesión
                </ThemedText>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        );
      }}>
      <Drawer.Screen
        name="home"
        options={{
          title: 'Home',
          drawerLabel: 'Home',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="productos"
        options={{
          title: 'Productos',
          drawerLabel: 'Productos',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="cube-outline" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="ventas"
        options={{
          title: 'Ventas',
          drawerLabel: 'Ventas',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="cart-outline" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="reportes"
        options={{
          title: 'Reportes',
          drawerLabel: 'Reportes',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="document-text-outline" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="configuracion"
        options={{
          title: 'Configuración',
          drawerLabel: 'Configuración',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="productos/nuevo"
        options={{
          title: 'Nuevo Producto',
          drawerItemStyle: { display: 'none' },
        }}
      />
      <Drawer.Screen
        name="productos/editar"
        options={{
          title: 'Editar Producto',
          drawerItemStyle: { display: 'none' },
        }}
      />
      <Drawer.Screen
        name="ventas/nuevo"
        options={{
          title: 'Nueva Venta',
          drawerItemStyle: { display: 'none' },
        }}
      />
      <Drawer.Screen
        name="ventas/editar"
        options={{
          title: 'Editar Venta',
          drawerItemStyle: { display: 'none' },
        }}
      />
      <Drawer.Screen
        name="ventas/detalle"
        options={{
          title: 'Detalle de Venta',
          drawerItemStyle: { display: 'none' },
        }}
      />
      <Drawer.Screen
        name="cerrar-sesion"
        options={{
          title: 'Cerrar sesión',
          drawerLabel: 'Cerrar sesión',
          drawerItemStyle: { display: 'none' },
        }}
      />
    </Drawer>
  );
}

function getIconName(routeName: string): keyof typeof Ionicons.glyphMap {
  const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
    home: 'home-outline',
    productos: 'cube-outline',
    ventas: 'cart-outline',
    reportes: 'document-text-outline',
    configuracion: 'settings-outline',
  };
  return icons[routeName] || 'ellipse-outline';
}

function getLabel(routeName: string): string {
  const labels: { [key: string]: string } = {
    home: 'Home',
    productos: 'Productos',
    ventas: 'Ventas',
    reportes: 'Reportes',
    configuracion: 'Configuración',
  };
  return labels[routeName] || routeName;
}

const styles = StyleSheet.create({
  drawerContent: {
    flex: 1,
  },
  drawerHeader: {
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  drawerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  drawerSubtitle: {
    fontSize: 14,
    opacity: 0.7,
  },
  drawerItems: {
    flex: 1,
    paddingTop: 10,
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingLeft: 20,
  },
  drawerItemActive: {
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
  },
  drawerItemText: {
    marginLeft: 16,
    fontSize: 16,
  },
});

