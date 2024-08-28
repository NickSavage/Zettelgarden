import SwiftUI
import ZettelgardenShared

struct LoginView: View {
    @StateObject private var viewModel = AuthViewModel()

    var body: some View {
        VStack {
            Text("Zettelgarden")
                .font(.largeTitle)
                .padding(.bottom, 20)

            TextField("Email", text: $viewModel.email)
                .textFieldStyle(RoundedBorderTextFieldStyle())
                .padding(.horizontal)
                .autocapitalization(.none)
                .autocorrectionDisabled(true)

            SecureField("Password", text: $viewModel.password)
                .textFieldStyle(RoundedBorderTextFieldStyle())
                .padding(.horizontal)

            if viewModel.isLoading {
                ProgressView()
                    .padding()
            }
            else {
                Button(action: {
                    SwiftUI.Task {
                        await viewModel.doLogin()
                    }
                }) {
                    Text("Login")
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color.blue)
                        .foregroundColor(.white)
                        .cornerRadius(8)
                }
                .padding(.horizontal)

                EnvironmentSelectorView()
            }

            if let loginError = viewModel.loginError {
                Text(loginError)
                    .foregroundColor(.red)
                    .padding()
            }
        }
        .padding()
    }
}

struct LoginView_Previews: PreviewProvider {
    static var previews: some View {
        LoginView()
    }
}
