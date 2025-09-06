import React, { useState, useEffect } from "react";
import "../App.css";
import { SearchPage } from "./cards/SearchPage";
import { UserSettingsPage } from "./UserSettings";
import { FileVault } from "./FileVault";
import { ViewPage } from "./cards/ViewPage";
import { EditPage } from "./cards/EditPage";
import { Sidebar } from "../components/Sidebar";
import { useAuth } from "../contexts/AuthContext";
import { Dialog } from "../components/Dialog";
import { Navigate, useNavigate } from "react-router-dom";
import { Route, Routes } from "react-router-dom";
import { EmailValidationBanner } from "../components/EmailValidationBanner";
import Success from "./Success";
import Cancel from "./Cancel";
import SubscribePage from "./SubscribePage";
import { DashboardPage } from "./DashboardPage";
import { GettingStartedPage } from "./GettingStartedPage";
import { Card, PartialCard, SearchResult } from "../models/Card";
import { TaskPage } from "./tasks/TaskPage";
import { TaskProvider, useTaskContext } from "../contexts/TaskContext";
import { TagProvider } from "../contexts/TagContext";
import { ChatProvider, useChatContext } from "../contexts/ChatContext";
import {
  PartialCardProvider,
  usePartialCardContext,
} from "../contexts/CardContext";
import { ShortcutProvider } from "../contexts/ShortcutContext";
import { FileProvider } from "../contexts/FileContext";
import { EntityPage } from "./EntityPage";
import { CardRefreshProvider } from "../contexts/CardRefreshContext";
import { Summarizer } from "./Summarizer";
import { FactPage } from "./FactPage";
import { MemoryPage } from "./MemoryPage";

import { SearchConfig } from "../models/PinnedSearch";

function MainAppContent() {
  const navigate = useNavigate();
  const [showGettingStarted, setShowGettingStarted] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchConfig, setSearchConfig] = useState<SearchConfig>({
    sortBy: "sortRanking",
    currentPage: 1,
    useClassicSearch: false,
    useFullText: false,
    onlyParentCards: false,
    showEntities: true,
    showPreview: true,
    showFacts: true,
    showCards: true,
    searchType: "typesense",
    rerank: true,
  });
  const {
    isAuthenticated,
    isLoading,
    hasSubscription,
    logoutUser,
    user,
    updateUser,
  } = useAuth();
  const { setRefreshTasks } = useTaskContext();
  const { setRefreshPartialCards } = usePartialCardContext();
  const { showChat, setShowChat } = useChatContext();

  // changing pages

  async function handleNewCard(cardType: string) {
    navigate("/app/card/new", { state: { cardType: cardType } });
  }

  async function handleCloseGettingStarted() {
    setShowGettingStarted(false);
    if (user) {
      user.has_seen_getting_started = true;
      updateUser(user);
    }
  }

  useEffect(() => {
    if (user && !user.has_seen_getting_started) {
      setShowGettingStarted(true);
    }
  }, [user]);

  useEffect(() => {
    if (!localStorage.getItem("token")) {
      logoutUser();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    setRefreshTasks(true);
    setRefreshPartialCards(true);
  }, []);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  {/* <Dialog isOpen={showGettingStarted} onClose={handleCloseGettingStarted}>
        <GettingStartedPage />
      </Dialog> */}
  return (
    <div>

      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <div className="flex-grow overflow-y-auto">
          <div className="">
            <EmailValidationBanner />
            <Routes>
              <Route path="subscription" element={<SubscribePage />} />
              <Route path="settings/billing/success" element={<Success />} />
              <Route path="settings/billing/cancel" element={<Cancel />} />
              <>
                <Route
                  path="search"
                  element={
                    <SearchPage
                      searchTerm={searchTerm}
                      setSearchTerm={setSearchTerm}
                      searchResults={searchResults}
                      setSearchResults={setSearchResults}
                      searchConfig={searchConfig}
                      setSearchConfig={setSearchConfig}
                    />
                  }
                />
                <Route path="card/:id" element={<ViewPage />} />
                <Route
                  path="card/:id/edit"
                  element={<EditPage newCard={false} />}
                />

                <Route path="card/new" element={<EditPage newCard={true} />} />
                <Route path="settings" element={<UserSettingsPage />} />
                <Route path="help" element={<GettingStartedPage />} />
                <Route path="files" element={<FileVault />} />
                <Route path="tasks" element={<TaskPage />} />
                <Route path="entities" element={<EntityPage />} />
                <Route path="summarizer" element={<Summarizer />} />
                <Route path="facts" element={<FactPage />} />
                <Route path="memory" element={<MemoryPage />} />
                <Route path="*" element={<DashboardPage />} />
              </>
              ) : (
              <Route
                path="*"
                element={<Navigate to="/app/subscription" replace />}
              />
            </Routes>
          </div>
        </div>
      </div>
    </div>
  );
}

function MainApp() {
  return (
    <TagProvider>
      <ChatProvider>
        <PartialCardProvider>
          <TaskProvider>
            <ShortcutProvider>
              <FileProvider>
                <CardRefreshProvider>
                  <MainAppContent />
                </CardRefreshProvider>
              </FileProvider>
            </ShortcutProvider>
          </TaskProvider>
        </PartialCardProvider>
      </ChatProvider>
    </TagProvider>
  );
}

export default MainApp;
