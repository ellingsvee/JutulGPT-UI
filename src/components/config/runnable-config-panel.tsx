"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Settings, Plus, Trash2 } from "lucide-react";

export interface RunnableConfig {
    tags?: string[];
    metadata?: Record<string, any>;
    recursion_limit?: number;
    configurable?: {
        // Base Configuration
        use_local_model?: boolean;
        retrieve_fimbul?: boolean;
        max_iterations?: number;
        human_interaction?: boolean;
        allow_package_installation?: boolean;
        embedding_model?: string;
        retriever_provider?: "faiss" | "chroma";
        search_type?: "similarity" | "mmr" | "similarity_score_threshold";
        search_kwargs?: Record<string, any>;
        rerank_provider?: "None" | "flash";
        rerank_kwargs?: Record<string, any>;
        response_model?: string;
        default_coder_prompt?: string;
        // Allow other custom fields
        [key: string]: any;
    };
    [key: string]: any;
}

interface RunnableConfigPanelProps {
    config: RunnableConfig;
    onConfigChange: (config: RunnableConfig) => void;
    isOpen: boolean;
    onToggle: () => void;
}

export function RunnableConfigPanel({
    config,
    onConfigChange,
    isOpen,
    onToggle,
}: RunnableConfigPanelProps) {
    const [localConfig, setLocalConfig] = useState<RunnableConfig>(config);
    const [newTag, setNewTag] = useState("");
    const [newMetadataKey, setNewMetadataKey] = useState("");
    const [newMetadataValue, setNewMetadataValue] = useState("");
    const [newConfigurableKey, setNewConfigurableKey] = useState("");
    const [newConfigurableValue, setNewConfigurableValue] = useState("");

    useEffect(() => {
        setLocalConfig(config);
    }, [config]);

    // Auto-apply configuration changes
    useEffect(() => {
        onConfigChange(localConfig);
    }, [localConfig, onConfigChange]);

    // Handle ESC key to close modal
    useEffect(() => {
        const handleEscKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && isOpen) {
                onToggle();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscKey);
            return () => document.removeEventListener('keydown', handleEscKey);
        }
    }, [isOpen, onToggle]);

    const handleApplyConfig = () => {
        onConfigChange(localConfig);
        onToggle(); // Close the modal
    };

    return (
        <div className="relative">
            <Button
                variant="outline"
                size="sm"
                onClick={onToggle}
                className="flex items-center gap-2"
            >
                <Settings className="h-4 w-4" />
                Config
            </Button>

            {isOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
                    onClick={onToggle} // Click outside to close
                >
                    <Card
                        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto mx-4"
                        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the card
                    >
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <Settings className="h-5 w-5" />
                                    Agent Configuration
                                </CardTitle>
                                <CardDescription>
                                    Modify the settings for this conversation
                                </CardDescription>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={onToggle}
                                className="h-8 w-8 text-xl"
                                aria-label="Close"
                            >
                                ×
                            </Button>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Model Configuration Section */}
                            <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                                <Label className="text-base font-semibold">Model Configuration</Label>

                                {/* Use Local Model */}
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label className="text-sm font-medium">Use Local Model</Label>
                                        <p className="text-xs text-muted-foreground">
                                            Whether to use local models through Ollama, or use the OpenAI API.
                                        </p>
                                    </div>
                                    <Switch
                                        checked={localConfig.configurable?.use_local_model ?? false}
                                        onCheckedChange={(checked) =>
                                            setLocalConfig({
                                                ...localConfig,
                                                configurable: {
                                                    ...localConfig.configurable,
                                                    use_local_model: checked,
                                                    // Auto-select appropriate models based on local/cloud preference
                                                    response_model: checked ? "ollama/qwen3:14b" : "openai/gpt-4.1-mini",
                                                    embedding_model: checked ? "ollama/nomic-embed-text" : "openai/text-embedding-3-small",
                                                },
                                            })
                                        }
                                    />
                                </div>

                                {/* Response Model */}
                                <div>
                                    <Label className="text-sm font-medium">Response Model</Label>
                                    <p className="text-xs text-muted-foreground mb-2">
                                        The language model used for generating responses.
                                    </p>
                                    <select
                                        value={localConfig.configurable?.response_model || ((localConfig.configurable?.use_local_model ?? false) ? "ollama/qwen3:14b" : "openai/gpt-4.1-mini")}
                                        onChange={(e) =>
                                            setLocalConfig({
                                                ...localConfig,
                                                configurable: {
                                                    ...localConfig.configurable,
                                                    response_model: e.target.value,
                                                },
                                            })
                                        }
                                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                    >
                                        {(localConfig.configurable?.use_local_model ?? false) ? (
                                            <>
                                                <option value="ollama/qwen3:14b">Qwen3 14B</option>
                                                <option value="ollama/llama3-groq-tool-use:8b">Llama3 Groq Tool Use 8B</option>
                                            </>
                                        ) : (
                                            <>
                                                <option value="openai/gpt-4.1-mini">OpenAI GPT-4.1 Mini</option>
                                                <option value="openai/gpt-4.1">OpenAI GPT-4.1</option>
                                            </>
                                        )}
                                    </select>
                                </div>

                                {/* Embedding Model */}
                                <div>
                                    <Label className="text-sm font-medium">Embedding Model</Label>
                                    <p className="text-xs text-muted-foreground mb-2">
                                        Name of the embedding model to use.
                                    </p>
                                    <select
                                        value={localConfig.configurable?.embedding_model || ((localConfig.configurable?.use_local_model ?? false) ? "ollama/nomic-embed-text" : "openai/text-embedding-3-small")}
                                        onChange={(e) =>
                                            setLocalConfig({
                                                ...localConfig,
                                                configurable: {
                                                    ...localConfig.configurable,
                                                    embedding_model: e.target.value,
                                                },
                                            })
                                        }
                                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                    >
                                        {(localConfig.configurable?.use_local_model ?? false) ? (
                                            <>
                                                <option value="ollama/nomic-embed-text">Nomic Embed Text</option>
                                            </>
                                        ) : (
                                            <>
                                                <option value="openai/text-embedding-3-small">OpenAI Text Embedding 3 Small</option>
                                            </>
                                        )}
                                    </select>
                                </div>
                            </div>

                            {/* Agent Configuration */}
                            <div>

                                {/* Retrieve Fimbul
                                <div className="flex items-center justify-between mt-4">
                                    <div className="space-y-0.5">
                                        <Label className="text-sm font-medium">Retrieve Fimbul</Label>
                                        <p className="text-xs text-muted-foreground">
                                            Whether to retrieve Fimbul documentation or not. If False, only JutulDarcy documentation is retrieved.
                                        </p>
                                    </div>
                                    <Switch
                                        checked={localConfig.configurable?.retrieve_fimbul ?? false}
                                        onCheckedChange={(checked) =>
   </>                                         setLocalConfig({
                                                ...localConfig,
                                                configurable: {
                                                    ...localConfig.configurable,
                                                    retrieve_fimbul: checked,
                                                },
                                            })
                                        }
                                    />
                                </div> */}

                                {/* Human Interaction */}
                                <div className="flex items-center justify-between mt-4">
                                    <div className="space-y-0.5">
                                        <Label className="text-sm font-medium">Human Interaction</Label>
                                        <p className="text-xs text-muted-foreground">
                                            Enable human-in-the-loop interaction to confirm and modify actions.
                                        </p>
                                    </div>
                                    <Switch
                                        checked={localConfig.configurable?.human_interaction ?? true}
                                        onCheckedChange={(checked) =>
                                            setLocalConfig({
                                                ...localConfig,
                                                configurable: {
                                                    ...localConfig.configurable,
                                                    human_interaction: checked,
                                                },
                                            })
                                        }
                                    />
                                </div>

                                {/* Max Iterations */}
                                <div className="mt-4">
                                    <Label className="text-sm font-medium">Max Iterations</Label>
                                    <p className="text-xs text-muted-foreground mb-2">
                                        How many times the model will try to fix the code if it fails.
                                    </p>
                                    <Input
                                        type="number"
                                        value={localConfig.configurable?.max_iterations || 3}
                                        onChange={(e) =>
                                            setLocalConfig({
                                                ...localConfig,
                                                configurable: {
                                                    ...localConfig.configurable,
                                                    max_iterations: e.target.value ? parseInt(e.target.value) : 3,
                                                },
                                            })
                                        }
                                        placeholder="3"
                                        className="mt-1"
                                        min="1"
                                        max="10"
                                    />
                                </div>

                                {/* Retriever Provider */}
                                <div className="mt-4">
                                    <Label className="text-sm font-medium">Retriever Provider</Label>
                                    <p className="text-xs text-muted-foreground mb-2">
                                        The vector store provider to use for retrieval.
                                    </p>
                                    <select
                                        value={localConfig.configurable?.retriever_provider || "chroma"}
                                        onChange={(e) =>
                                            setLocalConfig({
                                                ...localConfig,
                                                configurable: {
                                                    ...localConfig.configurable,
                                                    retriever_provider: e.target.value as "faiss" | "chroma",
                                                },
                                            })
                                        }
                                        className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                    >
                                        <option value="chroma">Chroma</option>
                                        <option value="faiss">FAISS</option>
                                    </select>
                                </div>

                                {/* Search Type */}
                                <div className="mt-4">
                                    <Label className="text-sm font-medium">Search Type</Label>
                                    <p className="text-xs text-muted-foreground mb-2">
                                        Defines the type of search that the retriever should perform.
                                    </p>
                                    <select
                                        value={localConfig.configurable?.search_type || "mmr"}
                                        onChange={(e) => {
                                            const searchType = e.target.value as "similarity" | "mmr" | "similarity_score_threshold";
                                            // Update search_kwargs based on the selected search type
                                            let defaultKwargs;
                                            switch (searchType) {
                                                case "similarity":
                                                    defaultKwargs = { k: 4 };
                                                    break;
                                                case "mmr":
                                                    defaultKwargs = { k: 4, fetch_k: 15, lambda_mult: 0.5 };
                                                    break;
                                                case "similarity_score_threshold":
                                                    defaultKwargs = { score_threshold: 0.5 };
                                                    break;
                                                default:
                                                    defaultKwargs = { k: 4 };
                                            }

                                            setLocalConfig({
                                                ...localConfig,
                                                configurable: {
                                                    ...localConfig.configurable,
                                                    search_type: searchType,
                                                    search_kwargs: defaultKwargs,
                                                },
                                            });
                                        }}
                                        className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                    >
                                        <option value="similarity">Similarity</option>
                                        <option value="mmr">MMR (Maximal Marginal Relevance)</option>
                                        <option value="similarity_score_threshold">Similarity Score Threshold</option>
                                    </select>
                                </div>

                                {/* Search Kwargs */}
                                <div className="mt-4">
                                    <Label className="text-sm font-medium">
                                        Search Parameters (JSON){" "}
                                        <a
                                            href="https://python.langchain.com/api_reference/chroma/vectorstores/langchain_chroma.vectorstores.Chroma.html#langchain_chroma.vectorstores.Chroma.as_retriever"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-500 hover:text-blue-700 underline text-s"
                                        >
                                            (docs)
                                        </a>
                                    </Label>
                                    <p className="text-xs text-muted-foreground mb-2">
                                        {(() => {
                                            const searchType = localConfig.configurable?.search_type || "mmr";
                                            switch (searchType) {
                                                case "similarity":
                                                    return "Parameters for similarity search.";
                                                case "mmr":
                                                    return "Parameters for MMR search.";
                                                case "similarity_score_threshold":
                                                    return "Parameters for score threshold search.";
                                                default:
                                                    return "Additional keyword arguments to pass to the search function of the retriever.";
                                            }
                                        })()}
                                    </p>
                                    <Textarea
                                        value={JSON.stringify(localConfig.configurable?.search_kwargs || (() => {
                                            const searchType = localConfig.configurable?.search_type || "mmr";
                                            switch (searchType) {
                                                case "similarity":
                                                    return { k: 4 };
                                                case "mmr":
                                                    return { k: 4, fetch_k: 15, lambda_mult: 0.5 };
                                                case "similarity_score_threshold":
                                                    return { score_threshold: 0.5 };
                                                default:
                                                    return { k: 4 };
                                            }
                                        })(), null, 2)}
                                        onChange={(e) => {
                                            try {
                                                const parsed = JSON.parse(e.target.value);
                                                setLocalConfig({
                                                    ...localConfig,
                                                    configurable: {
                                                        ...localConfig.configurable,
                                                        search_kwargs: parsed,
                                                    },
                                                });
                                            } catch {
                                                // Invalid JSON, don't update
                                            }
                                        }}
                                        placeholder={(() => {
                                            const searchType = localConfig.configurable?.search_type || "mmr";
                                            switch (searchType) {
                                                case "similarity":
                                                    return '{"k": 4}';
                                                case "mmr":
                                                    return '{"k": 4, "fetch_k": 15, "lambda_mult": 0.5}';
                                                case "similarity_score_threshold":
                                                    return '{"score_threshold": 0.5}';
                                                default:
                                                    return '{"k": 4 }';
                                            }
                                        })()}
                                        className="mt-1 font-mono text-sm"
                                        rows={3}
                                    />
                                </div>

                                {/* Rerank Provider */}
                                <div className="mt-4">
                                    <Label className="text-sm font-medium">Rerank Provider</Label>
                                    <p className="text-xs text-muted-foreground mb-2">
                                        The provider used for reranking the retrieved documents.
                                    </p>
                                    <select
                                        value={localConfig.configurable?.rerank_provider || "None"}
                                        onChange={(e) => {
                                            const rerankProvider = e.target.value as "None" | "flash";
                                            // Update rerank_kwargs based on the selected rerank provider
                                            let defaultKwargs;
                                            switch (rerankProvider) {
                                                case "None":
                                                    defaultKwargs = {};
                                                    break;
                                                case "flash":
                                                    defaultKwargs = { top_n: 3, score_threshold: 0.75 };
                                                    break;
                                                default:
                                                    defaultKwargs = {};
                                            }

                                            setLocalConfig({
                                                ...localConfig,
                                                configurable: {
                                                    ...localConfig.configurable,
                                                    rerank_provider: rerankProvider,
                                                    rerank_kwargs: defaultKwargs,
                                                },
                                            });
                                        }}
                                        className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                    >
                                        <option value="None">None</option>
                                        <option value="flash">Flash</option>
                                    </select>
                                </div>

                                {/* Rerank Kwargs */}
                                <div className="mt-4">
                                    <Label className="text-sm font-medium">Rerank Parameters (JSON)</Label>
                                    <p className="text-xs text-muted-foreground mb-2">
                                        {(() => {
                                            const rerankProvider = localConfig.configurable?.rerank_provider || "None";
                                            switch (rerankProvider) {
                                                case "None":
                                                    return "No parameters available when reranking is disabled.";
                                                case "flash":
                                                    return "Parameters for Flash reranker.";
                                                default:
                                                    return "Keyword arguments provided to the reranker.";
                                            }
                                        })()}
                                    </p>
                                    <Textarea
                                        value={JSON.stringify(localConfig.configurable?.rerank_kwargs || (() => {
                                            const rerankProvider = localConfig.configurable?.rerank_provider || "None";
                                            switch (rerankProvider) {
                                                case "None":
                                                    return {};
                                                case "flash":
                                                    return { top_n: 3, score_threshold: 0.75 };
                                                default:
                                                    return {};
                                            }
                                        })(), null, 2)}
                                        onChange={(e) => {
                                            try {
                                                const parsed = JSON.parse(e.target.value);
                                                setLocalConfig({
                                                    ...localConfig,
                                                    configurable: {
                                                        ...localConfig.configurable,
                                                        rerank_kwargs: parsed,
                                                    },
                                                });
                                            } catch {
                                                // Invalid JSON, don't update
                                            }
                                        }}
                                        placeholder={(() => {
                                            const rerankProvider = localConfig.configurable?.rerank_provider || "None";
                                            switch (rerankProvider) {
                                                case "None":
                                                    return '{}';
                                                case "flash":
                                                    return '{"top_n": 3, "score_threshold": 0.75}';
                                                default:
                                                    return '{}';
                                            }
                                        })()}
                                        disabled={(localConfig.configurable?.rerank_provider || "None") === "None"}
                                        className={`mt-1 font-mono text-sm ${(localConfig.configurable?.rerank_provider || "None") === "None" ? "opacity-50 cursor-not-allowed" : ""}`}
                                        rows={3}
                                    />
                                </div>

                                {/* Default Coder Prompt
                                <div className="mt-4">
                                    <Label className="text-sm font-medium">Default Coder Prompt</Label>
                                    <p className="text-xs text-muted-foreground mb-2">
                                        The default prompt used for generating Julia code.
                                    </p>
                                    <Textarea
                                        value={localConfig.configurable?.default_coder_prompt || ""}
                                        onChange={(e) =>
                                            setLocalConfig({
                                                ...localConfig,
                                                configurable: {
                                                    ...localConfig.configurable,
                                                    default_coder_prompt: e.target.value,
                                                },
                                            })
                                        }
                                        placeholder="Enter the default prompt for code generation..."
                                        className="mt-1"
                                        rows={4}
                                    />
                                </div> */}
                            </div>

                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
