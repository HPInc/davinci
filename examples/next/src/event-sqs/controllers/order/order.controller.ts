import { subscribe, payload } from '@davinci/event-sqs';
import OrderModel from './order.model';
import Order from './order.schema';

export default class OrderController {
	OrderModel = OrderModel;

	@subscribe('siteflow.order.shipped')
	handleOrderShipped(@payload() order: Order) {
		return this.OrderModel.findByIdAndUpdate(order._id, order);
	}
}
