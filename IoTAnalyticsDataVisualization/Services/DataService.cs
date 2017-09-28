using Microsoft.ServiceBus.Messaging;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.ServiceBus;

namespace IoTAnalyticsDataVisualization.Services
{
    public class DataService
    {
        private string SASKEYNAME = Environment.GetEnvironmentVariable("SHARED_ACCESS_POLICY_NAME");
        private string SASACCESSKEY = Environment.GetEnvironmentVariable("SHARED_ACCESS_POLICY_KEY");
        private const string NAMESPACEURL = "https://kentoriotandanalyticsservicebus.servicebus.windows.net";
        private const string SBQUEUE = "webservicebustopic"; //sessiontypedataqueue

        public List<string> dataPoints { get; set; }

        private static TokenProvider sasProvider;
        private static NamespaceManager namespaceManager;
        private static MessagingFactory factory;
        private static QueueClient queueClient;

        public DataService()
        {
            sasProvider = TokenProvider.CreateSharedAccessSignatureTokenProvider(SASKEYNAME, SASACCESSKEY, new TimeSpan(100, 0, 0, 0));
            namespaceManager = new NamespaceManager(NAMESPACEURL, sasProvider);
            factory = MessagingFactory.Create(ServiceBusEnvironment.CreateServiceUri("sb", "KentorIoTandAnalyticsServiceBus", string.Empty), sasProvider);
            queueClient = factory.CreateQueueClient(SBQUEUE);
        }

        public async Task<string> GetDataAsync(string subscriptionName)
        {
            var subscriptionMessageCount = namespaceManager.GetSubscription(SBQUEUE, subscriptionName).MessageCountDetails.ActiveMessageCount;
            if (subscriptionMessageCount == 0)
            {
                return string.Empty;
            }

            SubscriptionClient agentSubscriptionClient = factory.CreateSubscriptionClient(SBQUEUE, subscriptionName, ReceiveMode.PeekLock);


            BrokeredMessage message = await agentSubscriptionClient.ReceiveAsync(TimeSpan.FromSeconds(5));

            try
            {
                var messageBody = message.GetBody<string>();

                message.Complete();
                return messageBody;
            }
            catch (Exception)
            {
                message.Abandon();
                return string.Empty;
            }
        }

        public void CreateSubscription(string subscriptionName)
        {
            RemoveOldSubscriptions();
            namespaceManager.CreateSubscription(SBQUEUE, subscriptionName);
        }

        public void RemoveSubscription(string subscriptionName)
        {
            namespaceManager.DeleteSubscription(SBQUEUE, subscriptionName);
        }

        public void RemoveOldSubscriptions()
        {
            var allSubscriptions = namespaceManager.GetSubscriptions(SBQUEUE);

            foreach (var currentSubscription in allSubscriptions)
            {
                if (currentSubscription.AccessedAt < DateTime.Now.ToUniversalTime().AddMinutes(-10))
                {
                    namespaceManager.DeleteSubscription(SBQUEUE, currentSubscription.Name);
                }
            }
        }
    }
}