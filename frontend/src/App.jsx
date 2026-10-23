import { useState, useEffect } from "react";
import {
  Menu,
  X,
  Scale,
  LayoutDashboard,
  Search,
  Files,
  FileText,
  Sparkles,
  Upload,
  RefreshCw,
  ArrowUpRight,
  ShieldCheck,
  MessageSquareText,
  History,
} from "lucide-react";
import "./App.css";

// const API_URL = "http://localhost:5000/api";
const API_URL = import.meta.env.VITE_API_URL;

function App() {
  const [question, setQuestion] = useState("");
  const [page, setPage] = useState("dashboard");
  const [documents, setDocuments] = useState([]);
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [answer, setAnswer] = useState("");
  const [researching, setResearching] = useState(false);
  const [usedDocuments, setUsedDocuments] = useState([]);
  const [sourcePages, setSourcePages] = useState([]);
  const [selectedDocument, setSelectedDocument] = useState("");
  const [caseBrief, setCaseBrief] = useState("");
  const [generatingBrief, setGeneratingBrief] = useState(false);

  const [savedCaseBriefs, setSavedCaseBriefs] = useState([]);
  const [selectedSavedBrief, setSelectedSavedBrief] = useState(null);
  const [savingBrief, setSavingBrief] = useState(false);
  const [loadingBriefs, setLoadingBriefs] = useState(false);
  const [deletingBriefId, setDeletingBriefId] = useState("");
  const [briefSearch, setBriefSearch] = useState("");

  const [researchHistory, setResearchHistory] = useState([]);
  const [savedResearchChats, setSavedResearchChats] = useState([]);
  const [selectedResearchChatId, setSelectedResearchChatId] = useState("");
  const [loadingResearchHistory, setLoadingResearchHistory] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  // LOAD DOCUMENTS
  const loadDocuments = async () => {
    try {
      const response = await fetch(`${API_URL}/documents`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Could not load documents.");
      }

      const savedDocuments = (result.documents || []).map((doc) => ({
        id: doc._id,
        name: doc.originalName || "Unnamed PDF",
        size: ((doc.fileSize || 0) / 1024).toFixed(1),
      }));

      setDocuments(savedDocuments);
      return true;
    } catch (error) {
      console.error("Load documents error:", error);
      setMessage(`Could not load documents: ${error.message}`);
      return false;
    }
  };

  // LOAD RESEARCH HISTORY
  const loadResearchHistory = async () => {
    setLoadingResearchHistory(true);

    try {
      const response = await fetch(`${API_URL}/research/history`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Failed to load research history."
        );
      }

      setSavedResearchChats(result.histories || []);
    } catch (error) {
      console.error("Load research history error:", error);
    } finally {
      setLoadingResearchHistory(false);
    }
  };

  // SAVE OR UPDATE RESEARCH CONVERSATION
  const saveResearchConversation = async (
    messages,
    documentId,
    chatId
  ) => {
    try {
      const selectedDoc = documents.find(
        (doc) => String(doc._id || doc.id) === String(documentId)
      );

      const payload = {
        title:
          messages.find((item) => item.role === "user")?.text?.slice(0, 80) ||
          "New Research Chat",
        documentId: documentId || null,
        documentName: selectedDoc?.originalName || selectedDoc?.name || "",
        messages,
      };

      const isUpdating = Boolean(chatId);

      const response = await fetch(
        isUpdating
          ? `${API_URL}/research/history/${chatId}`
          : `${API_URL}/research/history`,
        {
          method: isUpdating ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Could not save conversation."
        );
      }

      setSelectedResearchChatId(result.history._id);
      await loadResearchHistory();
    } catch (error) {
      console.error("Save research conversation error:", error);
      setMessage(
        "Answer generated, but conversation could not be saved."
      );
    }
  };

  // OPEN SAVED RESEARCH CHAT
  const handleOpenResearchChat = async (chatId) => {
    try {
      const response = await fetch(
        `${API_URL}/research/history/${chatId}`
      );
      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Failed to open saved chat."
        );
      }

      const chat = result.history;

      setSelectedResearchChatId(chat._id);
      setSelectedDocument(chat.documentId || "");
      setResearchHistory(chat.messages || []);
      setAnswer("");
      setQuestion("");
      setUsedDocuments(
        chat.documentName ? [chat.documentName] : []
      );
      setMessage("Saved conversation opened.");
      setPage("research");
    } catch (error) {
      console.error("Open research history error:", error);
      setMessage("Could not open saved conversation.");
    }
  };

  // LOAD SAVED CASE BRIEFS
  const loadSavedCaseBriefs = async () => {
    setLoadingBriefs(true);

    try {
      const response = await fetch(`${API_URL}/case-briefs`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Could not load saved case briefs."
        );
      }

      setSavedCaseBriefs(result.caseBriefs || []);
      return true;
    } catch (error) {
      console.error("Load saved case briefs error:", error);
      setMessage(`Could not load saved briefs: ${error.message}`);
      return false;
    } finally {
      setLoadingBriefs(false);
    }
  };

  useEffect(() => {
    loadDocuments();
    loadSavedCaseBriefs();
    loadResearchHistory();
  }, []);

  // UPLOAD PDF DOCUMENTS
  const handleUpload = async (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = "";

    if (files.length === 0) return;

    const invalidFiles = files.filter(
      (file) =>
        file.type !== "application/pdf" ||
        !file.name.toLowerCase().endsWith(".pdf")
    );

    if (invalidFiles.length > 0) {
      setMessage("Only PDF files are supported.");
      return;
    }

    const oversizedFiles = files.filter(
      (file) => file.size > 10 * 1024 * 1024
    );

    if (oversizedFiles.length > 0) {
      setMessage("Each PDF must be 10 MB or smaller.");
      return;
    }

    setUploading(true);
    setMessage("");

    let successCount = 0;
    const errors = [];

    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append("document", file);

        try {
          const response = await fetch(
            `${API_URL}/documents/upload`,
            {
              method: "POST",
              body: formData,
            }
          );

          const result = await response.json();

          if (!response.ok) {
            throw new Error(result.message || "Upload failed.");
          }

          successCount++;
        } catch (error) {
          errors.push(`${file.name}: ${error.message}`);
        }
      }

      await loadDocuments();

      if (errors.length === 0) {
        setMessage(
          `${successCount} PDF file(s) uploaded successfully!`
        );
      } else {
        setMessage(
          `${successCount} uploaded successfully. Failed: ${errors.join(" | ")}`
        );
      }
    } finally {
      setUploading(false);
    }
  };

  // DELETE DOCUMENT FROM BACKEND AND MONGODB
  const removeDocument = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to permanently delete this PDF from the database?"
    );

    if (!confirmed) return;

    setMessage("");

    try {
      const response = await fetch(`${API_URL}/documents/${id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Could not delete the document."
        );
      }

      setDocuments((previous) =>
        previous.filter((document) => document.id !== id)
      );

      if (selectedDocument === id) {
        setSelectedDocument("");
        setCaseBrief("");
        setSelectedSavedBrief(null);
      }

      setMessage("PDF deleted successfully from the database!");
      await loadDocuments();
    } catch (error) {
      console.error("Delete document error:", error);
      setMessage(`Delete failed: ${error.message}`);
    }
  };

  // AI LEGAL RESEARCH
  const handleResearch = async () => {
    if (!question.trim()) {
      setMessage("Please enter a legal research question first.");
      return;
    }

    if (!selectedDocument) {
      setMessage("Please select a PDF before asking a question.");
      return;
    }

    const currentQuestion = question.trim();
    const previousHistory = [...researchHistory];

    setResearching(true);
    setMessage("");
    setQuestion("");

    setResearchHistory([
      ...previousHistory,
      { role: "user", text: currentQuestion },
    ]);

    try {
      const response = await fetch(`${API_URL}/research`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: currentQuestion,
          documentId: selectedDocument,
          history: previousHistory.slice(-10),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Could not generate a research answer."
        );
      }

      const generatedAnswer =
        result.answer || "No answer was returned.";

      // STEP 2: SAVE THE QUESTION AND ANSWER TO RESEARCH HISTORY
      const updatedMessages = [
        ...previousHistory,
        { role: "user", text: currentQuestion },
        { role: "model", text: generatedAnswer },
      ];

      setAnswer(generatedAnswer);
      setUsedDocuments(result.usedDocuments || []);
      setResearchHistory(updatedMessages);
      setSourcePages(result.sourcePages || []);
      setMessage("Answer generated using your selected PDF.");

      await saveResearchConversation(
        updatedMessages,
        selectedDocument,
        selectedResearchChatId
      );
    } catch (error) {
      console.error("Legal research error:", error);
      setMessage(`Research failed: ${error.message}`);

      setResearchHistory((prev) => prev.slice(0, -1));
      setQuestion(currentQuestion);
    } finally {
      setResearching(false);
    }
  };
    // AI CASE BRIEF GENERATOR
  const handleGenerateBrief = async () => {
    if (!selectedDocument) {
      setMessage("Please select a PDF document first.");
      return;
    }

    setGeneratingBrief(true);
    setMessage("");
    setCaseBrief("");
    setSelectedSavedBrief(null);

    try {
      const response = await fetch(
        `${API_URL}/research/brief/${selectedDocument}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Case brief generation failed."
        );
      }

      setCaseBrief(
        `Document: ${result.documentName || "Selected PDF"}\n\n${result.brief || ""}`
      );

      setMessage("Case brief generated successfully!");
    } catch (error) {
      console.error("Case brief error:", error);
      setMessage(`Case brief failed: ${error.message}`);
    } finally {
      setGeneratingBrief(false);
    }
  };

  // SAVE CASE BRIEF TO MONGODB
  const handleSaveCaseBrief = async () => {
    if (!caseBrief.trim()) {
      setMessage("Please generate a case brief first.");
      return;
    }

    if (
      selectedSavedBrief &&
      selectedSavedBrief.brief === caseBrief
    ) {
      setMessage("This case brief is already saved.");
      return;
    }

    setSavingBrief(true);
    setMessage("");

    try {
      const selectedDoc = documents.find(
        (doc) => doc.id === selectedDocument
      );

      const documentName =
        selectedDoc?.name ||
        selectedSavedBrief?.documentName ||
        "Case Brief";

      const response = await fetch(`${API_URL}/case-briefs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          documentId: selectedDocument || null,
          documentName,
          brief: caseBrief,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Could not save the case brief."
        );
      }

      setSelectedSavedBrief(result.caseBrief);
      await loadSavedCaseBriefs();
      setMessage("Case brief saved successfully in MongoDB!");
    } catch (error) {
      console.error("Save case brief error:", error);
      setMessage(`Save failed: ${error.message}`);
    } finally {
      setSavingBrief(false);
    }
  };

  // OPEN A SAVED CASE BRIEF
  const handleOpenSavedBrief = async (id) => {
    setMessage("");

    try {
      const response = await fetch(`${API_URL}/case-briefs/${id}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Could not open the saved brief."
        );
      }

      const savedBrief = result.caseBrief;

      setSelectedSavedBrief(savedBrief);
      setCaseBrief(savedBrief.brief || "");
      setSelectedDocument(savedBrief.documentId || "");
      setPage("cases");
      setMessage("Saved case brief opened successfully!");
    } catch (error) {
      console.error("Open saved brief error:", error);
      setMessage(`Could not open brief: ${error.message}`);
    }
  };

  // DELETE A SAVED CASE BRIEF
  const handleDeleteSavedBrief = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this saved case brief?"
    );

    if (!confirmed) return;

    setDeletingBriefId(id);
    setMessage("");

    try {
      const response = await fetch(`${API_URL}/case-briefs/${id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Could not delete the saved brief."
        );
      }

      setSavedCaseBriefs((previous) =>
        previous.filter((item) => item._id !== id)
      );

      if (selectedSavedBrief?._id === id) {
        setSelectedSavedBrief(null);
        setCaseBrief("");
      }

      setMessage("Saved case brief deleted successfully!");
    } catch (error) {
      console.error("Delete saved brief error:", error);
      setMessage(`Delete failed: ${error.message}`);
    } finally {
      setDeletingBriefId("");
    }
  };

  // DOWNLOAD CASE BRIEF
  const downloadCaseBrief = () => {
    if (!caseBrief.trim()) {
      setMessage("There is no case brief to download.");
      return;
    }

    const blob = new Blob([caseBrief], {
      type: "text/plain;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "LegalGenie-Case-Brief.txt";

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
  };

  // NAVIGATION
  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "research", label: "Legal Research", icon: Search },
    { id: "documents", label: "Documents", icon: Files },
    { id: "cases", label: "Case Briefs", icon: FileText },
    { id: "history", label: "Research History", icon: History },
  ];

  const openResearch = () => {
    setPage("research");
    setMessage("");
    setAnswer("");
    setUsedDocuments([]);
  };

  const openCases = () => {
    setPage("cases");
    setMessage("");
    setCaseBrief("");
    setSelectedSavedBrief(null);
  };

  const filteredBriefs = savedCaseBriefs.filter((item) =>
    (item.documentName || "")
      .toLowerCase()
      .includes(briefSearch.toLowerCase().trim())
  );

  // USER INTERFACE
  return (
    <div className="app">
      <aside className={`sidebar ${mobileMenuOpen ? "mobile-open" : ""}`}>
        <button
  type="button"
  className="mobile-menu-toggle"
  onClick={() => setMobileMenuOpen((open) => !open)}
  aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
  aria-expanded={mobileMenuOpen}
>
  {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
</button>
        <h2 className="brand">
          <span className="brand-icon">
            <Scale size={21} />
          </span>
          LegalGenie
        </h2>
        
        <p className="tagline">AI Legal Research Assistant</p>

        <nav>
          {navItems.map((item) => (
            <button
              key={item.id}
              className={`nav-link ${page === item.id ? "active" : ""}`}
              onClick={() => {
                setPage(item.id);
                setMessage("");
              }}
            >
              <span className="nav-icon">
                <item.icon size={19} strokeWidth={1.8} />
              </span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <p>LegalGenie AI</p>
          <small>Research smarter. Work faster.</small>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <h1>
              {page === "dashboard" && "Welcome to LegalGenie 👋"}
              {page === "research" && "Legal Research"}
              {page === "documents" && "Legal Documents"}
              {page === "cases" && "Case Briefs"}
              {page === "history" && "Research History"}
            </h1>

            <p>Your AI-powered legal research workspace</p>
          </div>

          <span className="status">AI Assistant</span>
        </header>

        {/* RESEARCH HISTORY */}
        {page === "history" && (
          <section className="page-panel">
            <div className="page-heading">
              <div>
                <h2>Research History</h2>
                <p>
                  View your previously saved legal research conversations.
                </p>
              </div>

              <button
                className="secondary-button"
                onClick={loadResearchHistory}
                disabled={loadingResearchHistory}
              >
                {loadingResearchHistory ? "Loading..." : "Refresh"}
              </button>
            </div>

            {loadingResearchHistory ? (
              <p>Loading saved conversations...</p>
            ) : savedResearchChats.length === 0 ? (
              <p className="empty-state">
                No saved research conversations yet.
              </p>
            ) : (
              <div className="document-list">
                {savedResearchChats.map((chat) => (
                  <div className="document-row" key={chat._id}>
                    <div className="document-info">
                      <h3>{chat.title}</h3>
                      <p>{chat.documentName || "No document name"}</p>
                      <small>
                        {chat.updatedAt
                          ? new Date(chat.updatedAt).toLocaleString()
                          : ""}
                      </small>
                    </div>

                    <button
                      className="secondary-button"
                      onClick={() => handleOpenResearchChat(chat._id)}
                    >
                      Open
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
                {/* DASHBOARD */}
        {page === "dashboard" && (
          <>
            <section className="hero">
              <span className="eyebrow">YOUR LEGAL WORKSPACE</span>
              <h2>Legal research, simplified.</h2>
              <p>
                Explore legal documents, summarize judgments, and discover
                relevant information with AI assistance.
              </p>
            </section>

            <section className="stats">
              <button
                className="stat-card"
                onClick={() => {
                  setPage("documents");
                  setMessage("");
                  loadDocuments();
                }}
              >
                <span>📄</span>
                <h3>Documents</h3>
                <p>{documents.length} documents saved</p>
              </button>

              <button className="stat-card" onClick={openResearch}>
                <span>🔎</span>
                <h3>Legal Research</h3>
                <p>Explore legal information</p>
              </button>

              <button className="stat-card" onClick={openCases}>
                <span>📝</span>
                <h3>Case Briefs</h3>
                <p>{savedCaseBriefs.length} saved case briefs</p>
              </button>
            </section>

            <section className="research">
              <h2>Ask LegalGenie</h2>
              <p>Ask a question about your legal research.</p>

              <textarea
                placeholder="Example: What are the key issues in this judgment?"
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
              />

              <button className="primary-button" onClick={openResearch}>
                ✨ Start Research
              </button>

              {message && <p role="status">{message}</p>}
            </section>
          </>
        )}

        {/* DOCUMENT LIBRARY */}
        {page === "documents" && (
          <section className="page-panel">
            <div className="section-heading">
              <div>
                <h2>Document Library</h2>
                <p>Upload legal judgments in PDF format.</p>
              </div>

              <label
                className={`primary-button upload-button ${
                  uploading ? "disabled" : ""
                }`}
              >
                {uploading ? "Uploading..." : "+ Upload PDF"}
                <input
                  type="file"
                  accept=".pdf,application/pdf"
                  multiple
                  onChange={handleUpload}
                  disabled={uploading}
                  hidden
                />
              </label>
            </div>

            {message && <p role="status">{message}</p>}

            <div className="upload-area">
              <span>📄</span>
              <h3>Upload legal documents</h3>
              <p>
                Select one or more PDF judgments from your computer.
              </p>
              <p className="muted">
                PDFs are saved to the backend, with document details stored
                in MongoDB.
              </p>

              <label className="secondary-button">
                {uploading ? "Uploading..." : "Choose PDF files"}
                <input
                  type="file"
                  accept=".pdf,application/pdf"
                  multiple
                  onChange={handleUpload}
                  disabled={uploading}
                  hidden
                />
              </label>
            </div>

            <div className="section-heading">
              <h3>Saved Documents ({documents.length})</h3>

              <button
                className="secondary-button"
                onClick={loadDocuments}
                disabled={uploading}
              >
                ↻ Refresh
              </button>
            </div>

            {documents.length === 0 ? (
              <p className="empty-state">
                No saved documents found. Upload a PDF to get started.
              </p>
            ) : (
              <div className="document-list">
                {documents.map((document) => (
                  <div className="document-row" key={document.id}>
                    <span className="pdf-icon">PDF</span>

                    <div className="document-info">
                      <strong>{document.name}</strong>
                      <small>
                        {document.size} KB · Saved document
                      </small>
                    </div>

                    <button
                      className="delete-button"
                      onClick={() => removeDocument(document.id)}
                      aria-label={`Remove ${document.name} from this list`}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* LEGAL RESEARCH */}
        {page === "research" && (
          <section className="page-panel">
            <h2>Chat with Your Legal PDF</h2>

            <p>
              Select a legal document and ask questions about its contents.
              You can also ask follow-up questions.
            </p>

            <label htmlFor="research-document">
              Select PDF document
            </label>

            <select
              id="research-document"
              value={selectedDocument}
              onChange={(event) => {
                setSelectedDocument(event.target.value);
                setResearchHistory([]);
                setSelectedResearchChatId("");
                setAnswer("");
                setUsedDocuments([]);
                setSourcePages([]);
                setMessage("");
              }}
              disabled={researching}
            >
              <option value="">-- Choose a PDF --</option>

              {documents.map((document) => (
                <option key={document.id} value={document.id}>
                  {document.name}
                </option>
              ))}
            </select>

            {documents.length === 0 && (
              <p className="muted">
                Upload a PDF in the Documents page before starting research.
              </p>
            )}

            <div className="research-answer">
              <h3>💬 Conversation</h3>

              {researchHistory.length === 0 ? (
                <p className="muted">
                  Your questions and answers will appear here.
                </p>
              ) : (
                researchHistory.map((item, index) => (
                  <div
                    key={`${index}-${item.role}`}
                    style={{
                      marginBottom: "16px",
                      padding: "12px",
                      borderRadius: "8px",
                      background:
                        item.role === "user" ? "#eef2ff" : "#f3f4f6",
                    }}
                  >
                    <strong>
                      {item.role === "user" ? "You" : "⚖ LegalGenie"}
                    </strong>

                    
                    <p
                      style={{
                        whiteSpace: "pre-wrap",
                        lineHeight: 1.7,
                        marginBottom: 0,
                      }}
                    >
                      {item.role === "model"
                        ? item.text.split(/(\[Source: [^\]]+\])/g).map((part, citationIndex) => {
                            const match = part.match(
                              /^\[Source: (.+), p\.\s*(\d+)\]$/
                            );

                            if (!match) return part;

                            const documentName = match[1].trim();
                            const pageNumber = Number(match[2]);

                            const source = sourcePages.find(
                              (s) =>
                                s.documentName === documentName &&
                                Number(s.pageNumber) === pageNumber
                            );

                            if (!source) return part;

                            return (
                              <a
                                key={`${citationIndex}-${source.documentId}-${pageNumber}`}
                                href={`http://localhost:5000/api/documents/${source.documentId}/pdf#page=${pageNumber}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  color: "#2563eb",
                                  textDecoration: "underline",
                                  cursor: "pointer",
                                }}
                              >
                                {part}
                              </a>
                            );
                          })
                        : item.text}
                    </p>

                  </div>
                ))
              )}

              {researching && <p>LegalGenie is thinking...</p>}
            </div>

            <textarea
              placeholder="Ask about the selected PDF or ask a follow-up question..."
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              disabled={researching}
            />

            <button
              className="primary-button"
              onClick={handleResearch}
              disabled={
                researching || !selectedDocument || !question.trim()
              }
            >
              {researching
                ? "Generating answer..."
                : "✨ Ask LegalGenie"}
            </button>

            {/* STEP 3: START A NEW CHAT */}
            <button
              className="secondary-button"
              onClick={() => {
                setResearchHistory([]);
                setSelectedResearchChatId("");
                setQuestion("");
                setAnswer("");
                setUsedDocuments([]);
                setMessage("");
                setSourcePages([]);
              }}
              disabled={researching}
            >
              + New Chat
            </button>

            {message && <p role="status">{message}</p>}

            {usedDocuments.length > 0 && (
              <div>
                <h4>Documents considered</h4>
                <ul>
                  {usedDocuments.map((name, index) => (
                    <li key={`${name}-${index}`}>{name}</li>
                  ))}
                </ul>
              </div>
            )}
            <p className="muted">
              AI-generated legal information may be incomplete.
              Verify important facts and consult a qualified legal professional.
            </p>
          </section>
        )}
                {/* CASE BRIEF GENERATOR AND SAVED BRIEFS */}
        {page === "cases" && (
          <section className="page-panel">
            <h2>AI Case Brief Generator</h2>

            <p>
              Select an uploaded legal judgment PDF to generate a structured
              case brief using Gemini AI.
            </p>

            {message && <p role="status">{message}</p>}

            {documents.length === 0 ? (
              <div className="empty-state">
                No saved PDFs found. Upload a legal judgment from the
                Documents page first.
              </div>
            ) : (
              <>
                <label htmlFor="case-document">
                  Select a legal document
                </label>

                <select
                  id="case-document"
                  value={selectedDocument}
                  onChange={(event) => {
                    setSelectedDocument(event.target.value);
                    setCaseBrief("");
                    setSelectedSavedBrief(null);
                    setMessage("");
                  }}
                  disabled={generatingBrief || savingBrief}
                >
                  <option value="">-- Choose a PDF --</option>

                  {documents.map((document) => (
                    <option key={document.id} value={document.id}>
                      {document.name}
                    </option>
                  ))}
                </select>

                <button
                  className="primary-button"
                  onClick={handleGenerateBrief}
                  disabled={generatingBrief || !selectedDocument}
                >
                  {generatingBrief
                    ? "Generating Case Brief..."
                    : "✨ Generate Case Brief"}
                </button>
              </>
            )}

            {caseBrief && (
              <div className="research-answer">
                <h3>⚖ Case Brief</h3>

                <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.7 }}>
                  {caseBrief}
                </div>

                <div className="section-heading">
                  <button
                    className="primary-button"
                    onClick={handleSaveCaseBrief}
                    disabled={
                      savingBrief ||
                      (Boolean(selectedSavedBrief) &&
                        selectedSavedBrief.brief === caseBrief)
                    }
                  >
                    {savingBrief
                      ? "Saving..."
                      : selectedSavedBrief?.brief === caseBrief
                        ? "✓ Already Saved"
                        : "💾 Save Case Brief"}
                  </button>

                  <button
                    className="secondary-button"
                    onClick={downloadCaseBrief}
                  >
                    Download Case Brief (.txt)
                  </button>
                </div>
              </div>
            )}

            <p className="muted">
              AI-generated summaries may omit important details. Verify the
              original judgment before relying on the summary.
            </p>

            <hr />

            {/* SAVED CASE BRIEFS */}
            <div className="section-heading">
              <div>
                <h2>Saved Case Briefs</h2>
                <p>
                  {savedCaseBriefs.length} brief(s) saved in your database.
                </p>
              </div>

              <button
                className="secondary-button"
                onClick={loadSavedCaseBriefs}
                disabled={loadingBriefs}
              >
                {loadingBriefs ? "Refreshing..." : "↻ Refresh"}
              </button>
            </div>

            <input
              type="text"
              placeholder="Search by document name..."
              value={briefSearch}
              onChange={(event) => setBriefSearch(event.target.value)}
              aria-label="Search saved case briefs"
            />

            {loadingBriefs ? (
              <p>Loading saved case briefs...</p>
            ) : filteredBriefs.length === 0 ? (
              <p className="empty-state">
                {savedCaseBriefs.length === 0
                  ? "No saved case briefs yet. Generate and save a brief to see it here."
                  : "No briefs match your search."}
              </p>
            ) : (
              <div className="document-list">
                {filteredBriefs.map((item) => (
                  <div className="document-row" key={item._id}>
                    <span className="pdf-icon">AI</span>

                    <div className="document-info">
                      <strong>{item.documentName}</strong>
                      <small>
                        Saved:{" "}
                        {item.createdAt
                          ? new Date(item.createdAt).toLocaleString()
                          : "Date unavailable"}
                      </small>
                    </div>

                    <button
                      className="secondary-button"
                      onClick={() => handleOpenSavedBrief(item._id)}
                    >
                      View
                    </button>

                    <button
                      className="delete-button"
                      onClick={() => handleDeleteSavedBrief(item._id)}
                      disabled={deletingBriefId === item._id}
                    >
                      {deletingBriefId === item._id
                        ? "Deleting..."
                        : "Delete"}
                    </button>
                  </div>
                ))}
              </div>
            )}

            {selectedSavedBrief && (
              <div className="research-answer">
                <h3>📚 Opened Saved Brief</h3>

                <p>
                  <strong>{selectedSavedBrief.documentName}</strong>
                </p>

                <p className="muted">
                  Saved on:{" "}
                  {selectedSavedBrief.createdAt
                    ? new Date(
                        selectedSavedBrief.createdAt
                      ).toLocaleString()
                    : "Date unavailable"}
                </p>

                <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.7 }}>
                  {selectedSavedBrief.brief}
                </div>

                <button
                  className="secondary-button"
                  onClick={downloadCaseBrief}
                >
                  Download Opened Brief (.txt)
                </button>
              </div>
            )}
          </section>
        )}

        <footer>
          © 2026 LegalGenie · AI-Powered Legal Research
        </footer>
      </main>
    </div>
  );
}

export default App;