import React, { useState, useEffect, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { getUserSubscription, getCurrentUser, editUser } from "../api/users";
import { requestPasswordReset } from "../api/auth";
import { User, EditUserParams, UserSubscription } from "../models/User";
import { useAuth } from "../contexts/AuthContext";
import { H6 } from "../components/Header";
import { createLLMProvider, getUserLLMConfigurations, getUserLLMProviders, updateLLMProvider, deleteLLMProvider, createLLMModel, deleteLLMModel } from "../api/chat";
import { LLMProvider, UserLLMConfiguration, LLMModel } from "../models/Chat";

const ProviderCard = ({
  provider,
  onUpdate,
  onDelete
}: {
  provider: LLMProvider,
  onUpdate: () => void,
  onDelete: () => void
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [models, setModels] = useState<LLMModel[]>([]);


  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const updatedProvider: LLMProvider = {
      ...provider,
      name: formData.get('name') as string,
      base_url: formData.get('base_url') as string,
      api_key_required: (formData.get('api_key_required') as string) === 'true',
      api_key: formData.get('api_key') as string,
    };

    try {
      await updateLLMProvider(provider.id!, updatedProvider);
      setIsEditing(false);
      onUpdate();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update provider');
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this provider?')) {
      try {
        await deleteLLMProvider(provider.id!);
        onDelete();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete provider');
      }
    }
  };

  // Add this useEffect to fetch models when the component mounts
  useEffect(() => {
    const fetchModels = async () => {
      try {
        const configurations = await getUserLLMConfigurations();
        // Filter and map configurations to get models for this provider
        const providerModels = configurations
          .filter(config => config.model?.provider?.id === provider.id)
          .map(config => config.model!)
          .filter((model): model is LLMModel => model !== undefined);

        // Remove duplicates based on model ID
        const uniqueModels = Array.from(
          new Map(providerModels.map(model => [model.id, model])).values()
        );

        setModels(uniqueModels);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch models');
      }
    };

    fetchModels();
  }, [provider.id]);


  if (isEditing) {
    return (
      <div className="border rounded-lg p-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Provider Name
              <input
                type="text"
                name="name"
                defaultValue={provider.name}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              />
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Base URL
              <input
                type="url"
                name="base_url"
                defaultValue={provider.base_url}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              />
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Requires API Key
              <select
                name="api_key_required"
                defaultValue={provider.api_key_required.toString()}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              >
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              API Key
              <input
                type="password"
                name="api_key"
                defaultValue={provider.api_key}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              />
            </label>
          </div>

          {error && (
            <div className="text-red-600 text-sm">{error}</div>
          )}

          <div className="flex space-x-4">
            <button
              type="submit"
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Save Changes
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </form>
        <ModelsList
          providerId={provider.id!}
          models={models}
          onModelAdded={async () => {
            // Refresh the models list
            const configurations = await getUserLLMConfigurations();
            const providerModels = configurations
              .filter(config => config.model?.provider?.id === provider.id)
              .map(config => config.model!)
              .filter((model): model is LLMModel => model !== undefined);

            const uniqueModels = Array.from(
              new Map(providerModels.map(model => [model.id, model])).values()
            );

            setModels(uniqueModels);

          }}
          onModelDeleted={async () => {
            // Refresh the models list using the same logic
            const configurations = await getUserLLMConfigurations();
            const providerModels = configurations
              .filter(config => config.model?.provider?.id === provider.id)
              .map(config => config.model!)
              .filter((model): model is LLMModel => model !== undefined);

            const uniqueModels = Array.from(
              new Map(providerModels.map(model => [model.id, model])).values()
            );

            setModels(uniqueModels);
          }}

        />

      </div>
    );

  }

  return (
    <div className="border rounded-lg p-4">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-medium">{provider.name}</h3>
          <p className="text-sm text-gray-600">
            Base URL: {provider.base_url || "Default"}
          </p>
          <p className="text-sm text-gray-600">
            API Key Required: {provider.api_key_required ? "Yes" : "No"}
          </p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setIsEditing(true)}
            className="text-blue-500 hover:text-blue-700"
          >
            Edit
          </button>
          <button
            onClick={handleDelete}
            className="text-red-500 hover:text-red-700"
          >
            Delete
          </button>
        </div>
      </div>
      {error && <div className="mt-2 text-red-600 text-sm">{error}</div>}
    </div>
  );
};

const NewProviderForm = ({ onProviderAdded }: { onProviderAdded: () => void }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const newProvider: LLMProvider = {
      name: formData.get('name') as string,
      base_url: formData.get('base_url') as string,
      api_key_required: (formData.get('api_key_required') as string) === 'true',
      api_key: formData.get('api_key') as string,
      id: 0,
      created_at: new Date(),
      updated_at: new Date(),
    };

    try {
      await createLLMProvider(newProvider);
      setIsAdding(false);
      onProviderAdded();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create provider');
    }
  };

  if (!isAdding) {
    return (
      <button
        onClick={() => setIsAdding(true)}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        Add New Provider
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Provider Name
          <input
            type="text"
            name="name"
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          />
        </label>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Base URL
          <input
            type="url"
            name="base_url"
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            placeholder="https://api.example.com"
          />
        </label>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Requires API Key
          <select
            name="api_key_required"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          >
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        </label>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          API Key (if required)
          <input
            type="password"
            name="api_key"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          />
        </label>
      </div>

      {error && (
        <div className="text-red-600 text-sm">{error}</div>
      )}

      <div className="flex space-x-4">
        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Save Provider
        </button>
        <button
          type="button"
          onClick={() => setIsAdding(false)}
          className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

const ModelsList = ({
  providerId,
  models,
  onModelAdded,
  onModelDeleted
}: {
  providerId: number;
  models: LLMModel[];
  onModelAdded: () => void;
  onModelDeleted: () => void;
}) => {
  const [isAddingModel, setIsAddingModel] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async (modelId: number) => {
    if (window.confirm('Are you sure you want to delete this model?')) {
      try {
        await deleteLLMModel(modelId);
        onModelDeleted();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete model');
      }
    }
  };
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const newModel = {
      provider_id: providerId,
      name: formData.get('name') as string,
      model_identifier: formData.get('model_identifier') as string,
    };

    try {
      await createLLMModel(newModel);
      setIsAddingModel(false);
      onModelAdded();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create model');
    }
  };

  return (
    <div className="mt-4">
      <div className="flex justify-between items-center mb-2">
        <h4 className="font-medium">Models</h4>
        <button
          onClick={() => setIsAddingModel(true)}
          className="text-sm text-blue-500 hover:text-blue-700"
        >
          Add Model
        </button>
      </div>

      {/* Models List */}
      <div className="space-y-2">
        {models.map((model) => (
          <div key={model.id} className="flex justify-between items-center text-sm text-gray-600 pl-2 border-l-2 border-gray-200">
            <span>{model.name} ({model.model_identifier})</span>
            <button
              onClick={() => handleDelete(model.id)}
              className="text-red-500 hover:text-red-700 text-sm"
            >
              Delete
            </button>
          </div>
        ))}
      </div>

      {/* Add Model Form */}
      {isAddingModel && (
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Model Name
              <input
                type="text"
                name="name"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-sm"
                placeholder="e.g., GPT-4"
              />
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Model Identifier
              <input
                type="text"
                name="model_identifier"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-sm"
                placeholder="e.g., gpt-4"
              />
            </label>
          </div>

          {error && (
            <div className="text-red-600 text-sm">{error}</div>
          )}

          <div className="flex space-x-4">
            <button
              type="submit"
              className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => setIsAddingModel(false)}
              className="bg-gray-300 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export function UserSettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [llmConfigurations, setLLMConfigurations] = useState<UserLLMConfiguration[]>([]);
  const [llmProviders, setLLMProviders] = useState<LLMProvider[]>([]);


  const navigate = useNavigate();
  const { logoutUser } = useAuth();

  async function handleSubmit(event: FormEvent) {
    event.preventDefault(); // Prevent the default form submit action

    // Get the form data
    const formData = new FormData(event.currentTarget as HTMLFormElement);
    const updatedUsername = formData.get("username");
    const updatedEmail = formData.get("email");

    if (!user) {
      setError("User data is not loaded");
      return;
    }

    // Prepare the data to be updated
    const updateData = {
      username: updatedUsername,
      email: updatedEmail,
      is_admin: user.is_admin,
    };

    try {
      // Call the editUser function with userId and the update data
      await editUser(user.id.toString(), updateData as EditUserParams);
      // Optionally, navigate to another route upon success or just show success message
      // navigate('/some-success-page'); or
      alert("User updated successfully");

      const currentUser = await getCurrentUser();
      setUser(currentUser);

      localStorage.setItem("username", currentUser["username"]);
    } catch (error: any) {
      // Handle any errors that occur during the update
      console.error("Failed to update user:", error);
      setError(error.message);
    }
  }

  const handlePasswordReset = async () => {
    if (!user?.email) return;

    try {
      setIsLoading(true);
      const response = await requestPasswordReset(user.email);
      if (response.error) {
        setError(response.message);
      } else {
        setSuccess("Password reset link has been sent to your email address.");
      }
    } catch (error) {
      setError("Failed to initiate password reset.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    async function fetchUserAndSubscription() {
      let userResponse = await getCurrentUser();
      console.log(userResponse);
      setUser(userResponse);
      console.log(userResponse);

      // Now that we have the user, fetch their subscription using the user ID
      if (userResponse && userResponse["id"]) {
        let subscriptionResponse = await getUserSubscription(
          userResponse["id"],
        );
        console.log(subscriptionResponse);
        setSubscription(subscriptionResponse);

        // Add this section to fetch LLM configurations
        try {
          const providers = await getUserLLMProviders();
          setLLMProviders(providers);
        } catch (error) {
          console.error("Failed to fetch LLM providers:", error);
        }

      }
    }

    document.title = "Zettelgarden - Settings";
    fetchUserAndSubscription();
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-6">

      <div className="space-y-6">
        <div>
          <div>
            <H6 children="Settings" />
          </div>
          <form onSubmit={handleSubmit}>
            <div>
              <label>
                Username:
                <input
                  type="text"
                  name="username"
                  defaultValue={user?.username}
                />
              </label>
            </div>
            <div>
              <label>
                Email:
                <input type="email" name="email" defaultValue={user?.email} />
              </label>
            </div>
            <button
              type="submit"
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
            >
              Save Changes
            </button>
          </form>
        </div>

        {/* Password Settings Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Password Settings</h2>
          <p className="text-gray-600 mb-4">
            To change your password, we'll send a password reset link to your email address.
          </p>
          <button
            onClick={handlePasswordReset}
            disabled={isLoading}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {isLoading ? "Sending..." : "Send Password Reset Link"}
          </button>
          {success && <div className="mt-2 text-green-600 text-sm">{success}</div>}
          {error && <div className="mt-2 text-red-600 text-sm">{error}</div>}
        </div>

        {/* Subscription Card */}
        {subscription && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Subscription</h2>
            <div className="space-y-2">
              <p>Status: <span className="font-medium">{subscription.stripe_subscription_status}</span></p>
              <p>Plan: <span className="font-medium">{subscription.stripe_subscription_frequency}</span></p>
              <a
                href="https://billing.stripe.com/p/login/test_28og184xZe4b51ecMM"
                className="text-blue-500 hover:underline"
              >
                Manage Subscription →
              </a>
            </div>
          </div>
        )}

        {/* LLM Configurations Card */}
        {(import.meta.env.VITE_FEATURE_CHAT === "true" || user?.username === "nick") && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">LLM Providers</h2>

          {/* Add the new provider form */}
          <NewProviderForm onProviderAdded={() => {
            // Refresh the providers list
            getUserLLMProviders().then(providers => setLLMProviders(providers));
          }} />

          <div className="space-y-4 mt-4">
            {llmProviders.length > 0 ? (
              llmProviders.map((provider) => (
                <ProviderCard
                  key={provider.id}
                  provider={provider}
                  onUpdate={() => {
                    // Refresh the providers list
                    getUserLLMProviders().then(providers => setLLMProviders(providers));
                  }}
                  onDelete={() => {
                    // Refresh the providers list
                    getUserLLMProviders().then(providers => setLLMProviders(providers));
                  }}
                />
              ))
            ) : (
              <p className="text-gray-600">No LLM providers found.</p>
            )}
          </div>
          </div>
        )}
      </div>
    </div>
  );
}
