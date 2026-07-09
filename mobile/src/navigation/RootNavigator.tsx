import { ActivityIndicator, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuth } from "@/auth/AuthContext";
import { LoginScreen } from "@/screens/LoginScreen";
import { RegisterScreen } from "@/screens/RegisterScreen";
import { HomeScreen } from "@/screens/HomeScreen";
import { ApplyAgencyScreen } from "@/screens/ApplyAgencyScreen";
import { AgentDashboardScreen } from "@/screens/AgentDashboardScreen";
import { ChargeUserScreen } from "@/screens/ChargeUserScreen";
import { WithdrawalRequestScreen } from "@/screens/WithdrawalRequestScreen";
import { RoomsListScreen } from "@/screens/RoomsListScreen";
import { RoomScreen } from "@/screens/RoomScreen";
import { ConversationsListScreen } from "@/screens/ConversationsListScreen";
import { ChatScreen } from "@/screens/ChatScreen";
import { ProfileScreen } from "@/screens/ProfileScreen";
import { GiftHistoryScreen } from "@/screens/GiftHistoryScreen";
import { GameHistoryScreen } from "@/screens/GameHistoryScreen";

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type AppStackParamList = {
  Home: undefined;
  ApplyAgency: undefined;
  AgentDashboard: undefined;
  ChargeUser: undefined;
  WithdrawalRequest: undefined;
  RoomsList: undefined;
  Room: { roomId: string };
  ConversationsList: undefined;
  Chat: { conversationId: string; otherUserName: string };
  Profile: undefined;
  GiftHistory: undefined;
  GameHistory: undefined;
};

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const AppStack = createNativeStackNavigator<AppStackParamList>();

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
    </AuthStack.Navigator>
  );
}

function AppNavigator() {
  return (
    <AppStack.Navigator screenOptions={{ headerStyle: { backgroundColor: "#0f1020" }, headerTintColor: "#fff" }}>
      <AppStack.Screen name="Home" component={HomeScreen} options={{ title: "الرئيسية" }} />
      <AppStack.Screen name="ApplyAgency" component={ApplyAgencyScreen} options={{ title: "طلب فتح وكالة" }} />
      <AppStack.Screen
        name="AgentDashboard"
        component={AgentDashboardScreen}
        options={{ title: "لوحة وكالة الشحن" }}
      />
      <AppStack.Screen name="ChargeUser" component={ChargeUserScreen} options={{ title: "شحن مستخدم" }} />
      <AppStack.Screen
        name="WithdrawalRequest"
        component={WithdrawalRequestScreen}
        options={{ title: "طلب سحب" }}
      />
      <AppStack.Screen name="RoomsList" component={RoomsListScreen} options={{ title: "الغرف الصوتية" }} />
      <AppStack.Screen name="Room" component={RoomScreen} options={{ headerShown: false }} />
      <AppStack.Screen
        name="ConversationsList"
        component={ConversationsListScreen}
        options={{ title: "الرسائل" }}
      />
      <AppStack.Screen
        name="Chat"
        component={ChatScreen}
        options={({ route }) => ({ title: route.params.otherUserName })}
      />
      <AppStack.Screen name="Profile" component={ProfileScreen} options={{ headerShown: false }} />
      <AppStack.Screen name="GiftHistory" component={GiftHistoryScreen} options={{ title: "سجل الهدايا" }} />
      <AppStack.Screen name="GameHistory" component={GameHistoryScreen} options={{ title: "سجل الألعاب" }} />
    </AppStack.Navigator>
  );
}

export function RootNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#0f1020" }}>
        <ActivityIndicator color="#5b4cf5" />
      </View>
    );
  }

  return <NavigationContainer>{user ? <AppNavigator /> : <AuthNavigator />}</NavigationContainer>;
}
