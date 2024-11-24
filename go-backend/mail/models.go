package mail

type MailClient struct {
	Host              string
	Password          string
	Testing           bool
	TestingEmailsSent int
}
